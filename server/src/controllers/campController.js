const Camp = require('../models/Camp');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// @desc    Create a new blood donation camp
// @route   POST /api/camps
// @access  Private (Admin)
const createCamp = async (req, res, next) => {
  try {
    const {
      name,
      organizer,
      venue,
      address,
      city,
      state,
      pincode,
      coordinates,
      date,
      startTime = '09:00',
      endTime = '17:00',
      capacity,
      slotDurationMinutes = 30,
      maxPerSlot = 10,
      coordinators = [],
      contactPerson,
      contactPhone,
      notes,
    } = req.body;

    if (!name || !organizer || !venue || !address || !city || !state || !pincode || !date || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, organizer, venue, address, city, state, pincode, date, and capacity.',
      });
    }

    const camp = await Camp.create({
      name,
      organizer,
      venue,
      address,
      city,
      state,
      pincode,
      coordinates: coordinates || { lat: 28.6139, lng: 77.2090 },
      date: new Date(date),
      startTime,
      endTime,
      capacity: Number(capacity),
      slotDurationMinutes: Number(slotDurationMinutes),
      maxPerSlot: Number(maxPerSlot),
      status: 'upcoming',
      coordinators,
      contactPerson: contactPerson || '',
      contactPhone: contactPhone || '',
      notes: notes || '',
    });

    await logAudit({
      user: req.user._id,
      action: 'CAMP_CREATED',
      entityType: 'Camp',
      entityId: camp._id,
      details: { name: camp.name, date: camp.date, capacity: camp.capacity },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Blood donation camp created successfully.',
      camp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all camps with search & filtering
// @route   GET /api/camps
// @access  Public
const getCamps = async (req, res, next) => {
  try {
    const { status, city, startDate, endDate, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (city && city !== 'all') {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { organizer: { $regex: new RegExp(search, 'i') } },
        { venue: { $regex: new RegExp(search, 'i') } },
        { city: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Camp.countDocuments(query);
    const camps = await Camp.find(query)
      .populate('coordinators', 'name email phone')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: camps.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      camps,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single camp by ID with slot availability breakdown
// @route   GET /api/camps/:id
// @access  Public
const getCampById = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id).populate('coordinators', 'name email phone');

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    // Get time slots
    const rawSlots = camp.generateTimeSlots();

    // Query active appointments to calculate slot usage dynamically
    const appointments = await Appointment.find({
      camp: camp._id,
      status: { $in: ['confirmed', 'checked_in', 'completed'] },
    }).select('slotStartTime slotEndTime donor');

    const slotMap = {};
    rawSlots.forEach((s) => {
      slotMap[s.startTime] = {
        startTime: s.startTime,
        endTime: s.endTime,
        label: s.label,
        maxPerSlot: camp.maxPerSlot,
        booked: 0,
        available: camp.maxPerSlot,
      };
    });

    appointments.forEach((appt) => {
      if (slotMap[appt.slotStartTime]) {
        slotMap[appt.slotStartTime].booked += 1;
        slotMap[appt.slotStartTime].available = Math.max(0, camp.maxPerSlot - slotMap[appt.slotStartTime].booked);
      }
    });

    const slots = Object.values(slotMap);

    res.status(200).json({
      success: true,
      camp,
      slots,
      remainingCapacity: Math.max(0, camp.capacity - appointments.length),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update camp
// @route   PUT /api/camps/:id
// @access  Private (Admin or assigned Coordinator)
const updateCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    // Check authorization: Admin or assigned coordinator
    const isCoordinator = camp.coordinators.some((c) => c.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this camp.',
      });
    }

    const updatableFields = [
      'name', 'organizer', 'venue', 'address', 'city', 'state', 'pincode',
      'coordinates', 'date', 'startTime', 'endTime', 'capacity', 'slotDurationMinutes',
      'maxPerSlot', 'status', 'coordinators', 'contactPerson', 'contactPhone', 'notes',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        camp[field] = req.body[field];
      }
    });

    // Auto-update status to full if bookedCount reaches capacity
    if (camp.bookedCount >= camp.capacity && camp.status === 'upcoming') {
      camp.status = 'full';
    }

    await camp.save();

    await logAudit({
      user: req.user._id,
      action: 'CAMP_UPDATED',
      entityType: 'Camp',
      entityId: camp._id,
      details: { updatedFields: Object.keys(req.body) },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Camp updated successfully.',
      camp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel camp and cascade cancellation to bookings
// @route   PUT /api/camps/:id/cancel
// @access  Private (Admin)
const cancelCamp = async (req, res, next) => {
  try {
    const { cancellationReason = 'Camp cancelled due to unforeseen operational circumstances.' } = req.body;
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    camp.status = 'cancelled';
    camp.cancellationReason = cancellationReason;
    await camp.save();

    // Find all active appointments and mark them cancelled
    const activeAppointments = await Appointment.find({
      camp: camp._id,
      status: { $in: ['confirmed', 'pending'] },
    }).populate('donor', 'name email');

    for (const appt of activeAppointments) {
      appt.status = 'cancelled';
      appt.cancellationReason = `Camp cancelled: ${cancellationReason}`;
      appt.cancelledAt = new Date();
      await appt.save();

      // Send notification to donor
      await Notification.create({
        recipient: appt.donor._id,
        title: `Camp Cancelled: ${camp.name}`,
        message: `The blood donation camp scheduled for ${new Date(camp.date).toLocaleDateString()} has been cancelled. Reason: ${cancellationReason}. Your appointment has been cancelled.`,
        type: 'camp_update',
        link: `/camps/${camp._id}`,
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'CAMP_CANCELLED',
      entityType: 'Camp',
      entityId: camp._id,
      details: { cancellationReason, affectedAppointmentsCount: activeAppointments.length },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Camp cancelled successfully. ${activeAppointments.length} donor appointment(s) updated and notified.`,
      camp,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCamp,
  getCamps,
  getCampById,
  updateCamp,
  cancelCamp,
};
