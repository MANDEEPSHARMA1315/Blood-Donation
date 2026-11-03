const Camp = require('../models/Camp');
const Appointment = require('../models/Appointment');
const DonorProfile = require('../models/DonorProfile');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// Generate unique appointment number: BDC-YYYY-XXXXX
const generateAppointmentNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BDC-${year}-${random}`;
};

// @desc    Book a new blood donation appointment
// @route   POST /api/appointments
// @access  Private (Donor, or Admin/Coordinator on behalf of donor)
const bookAppointment = async (req, res, next) => {
  try {
    const { campId, slotStartTime, slotEndTime, notes = '' } = req.body;
    const donorId = req.user.role === 'donor' ? req.user._id : (req.body.donorId || req.user._id);

    if (!campId || !slotStartTime || !slotEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Camp ID, slot start time, and slot end time are required.',
      });
    }

    // 1. Fetch Camp
    const camp = await Camp.findById(campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'The selected blood donation camp does not exist.',
      });
    }

    // Check if camp is open for bookings
    if (camp.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This camp has been cancelled and cannot accept new appointments.',
      });
    }

    if (camp.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This camp has already concluded.',
      });
    }

    // 2. Prevent Double Booking: Check if donor already has an active appointment for this camp
    const existingActiveAppointment = await Appointment.findOne({
      camp: campId,
      donor: donorId,
      status: { $in: ['confirmed', 'pending', 'checked_in'] },
    });

    if (existingActiveAppointment) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active appointment scheduled for this camp.',
        existingAppointmentId: existingActiveAppointment._id,
      });
    }

    // 3. Atomically check overall camp capacity
    const currentActiveAppointmentsCount = await Appointment.countDocuments({
      camp: campId,
      status: { $in: ['confirmed', 'pending', 'checked_in', 'completed'] },
    });

    if (currentActiveAppointmentsCount >= camp.capacity) {
      // Mark camp full if not already
      if (camp.status !== 'full') {
        camp.status = 'full';
        await camp.save();
      }
      return res.status(400).json({
        success: false,
        message: 'Camp capacity has been reached. No slots remain available.',
      });
    }

    // 4. Atomically check specific time slot capacity
    const slotAppointmentsCount = await Appointment.countDocuments({
      camp: campId,
      slotStartTime,
      status: { $in: ['confirmed', 'pending', 'checked_in'] },
    });

    if (slotAppointmentsCount >= camp.maxPerSlot) {
      return res.status(400).json({
        success: false,
        message: `The selected time slot (${slotStartTime} - ${slotEndTime}) is fully booked. Please choose another slot.`,
      });
    }

    // 5. Fetch donor profile
    const donorProfile = await DonorProfile.findOne({ user: donorId });

    // 6. Create appointment
    const appointmentNumber = generateAppointmentNumber();
    const appointment = await Appointment.create({
      camp: camp._id,
      donor: donorId,
      donorProfile: donorProfile ? donorProfile._id : null,
      slotStartTime,
      slotEndTime,
      appointmentNumber,
      status: 'confirmed',
      notes,
    });

    // Update camp bookedCount
    await Camp.findByIdAndUpdate(camp._id, {
      $inc: { bookedCount: 1 },
      ...(currentActiveAppointmentsCount + 1 >= camp.capacity ? { status: 'full' } : {}),
    });

    // 7. Create in-app notification for donor
    await Notification.create({
      recipient: donorId,
      title: 'Appointment Confirmed',
      message: `Your blood donation appointment #${appointmentNumber} at ${camp.name} is confirmed for ${new Date(camp.date).toLocaleDateString()} from ${slotStartTime} to ${slotEndTime}.`,
      type: 'booking',
      link: `/my-appointments`,
    });

    await logAudit({
      user: req.user._id,
      action: 'APPOINTMENT_BOOKED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: {
        campId: camp._id,
        slot: `${slotStartTime}-${slotEndTime}`,
        appointmentNumber,
      },
      req,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('camp', 'name venue address city date startTime endTime status')
      .populate('donor', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: populatedAppointment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's appointments (Donor) or all appointments with filters (Admin/Coordinator)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res, next) => {
  try {
    const { campId, status, page = 1, limit = 20 } = req.query;
    const query = {};

    // Donors can ONLY view their own appointments
    if (req.user.role === 'donor') {
      query.donor = req.user._id;
    } else if (req.query.donorId) {
      query.donor = req.query.donorId;
    }

    if (campId) query.camp = campId;
    if (status && status !== 'all') query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('camp', 'name venue address city date startTime endTime status contactPerson contactPhone')
      .populate('donor', 'name email phone')
      .populate('donorProfile', 'bloodGroup dateOfBirth gender totalDonationsCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      appointments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('camp')
      .populate('donor', 'name email phone')
      .populate('donorProfile');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Donor privacy check: cannot view other donors' appointments
    if (req.user.role === 'donor' && appointment.donor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this appointment.',
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Donor who booked it, or Admin/Coordinator)
const cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason = 'Cancelled by donor' } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate('camp');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Permission check
    if (req.user.role === 'donor' && appointment.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot cancel appointments belonging to other donors.',
      });
    }

    if (['completed', 'checked_in'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment that is already marked as ${appointment.status}.`,
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled.',
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Decrement camp bookedCount and reopen camp if was full
    await Camp.findByIdAndUpdate(appointment.camp._id, {
      $inc: { bookedCount: -1 },
      ...(appointment.camp.status === 'full' ? { status: 'upcoming' } : {}),
    });

    // Notify donor if cancelled by coordinator/admin
    if (req.user.role !== 'donor' || appointment.donor.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: appointment.donor,
        title: 'Appointment Cancelled',
        message: `Your appointment #${appointment.appointmentNumber} at ${appointment.camp.name} was cancelled: ${cancellationReason}`,
        type: 'cancellation',
        link: '/my-appointments',
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { cancellationReason },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reschedule appointment to a new slot
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Donor, or Admin/Coordinator)
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { slotStartTime, slotEndTime } = req.body;

    if (!slotStartTime || !slotEndTime) {
      return res.status(400).json({
        success: false,
        message: 'New slot start time and end time are required.',
      });
    }

    const appointment = await Appointment.findById(req.params.id).populate('camp');
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (req.user.role === 'donor' && appointment.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot reschedule appointments for other donors.',
      });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment that is already ${appointment.status}.`,
      });
    }

    // Check slot capacity for new slot
    const slotAppointmentsCount = await Appointment.countDocuments({
      camp: appointment.camp._id,
      slotStartTime,
      status: { $in: ['confirmed', 'pending', 'checked_in'] },
      _id: { $ne: appointment._id },
    });

    if (slotAppointmentsCount >= appointment.camp.maxPerSlot) {
      return res.status(400).json({
        success: false,
        message: `The selected time slot (${slotStartTime} - ${slotEndTime}) is already full. Please select an alternate slot.`,
      });
    }

    const oldSlot = `${appointment.slotStartTime}-${appointment.slotEndTime}`;
    appointment.slotStartTime = slotStartTime;
    appointment.slotEndTime = slotEndTime;
    await appointment.save();

    await Notification.create({
      recipient: appointment.donor,
      title: 'Appointment Rescheduled',
      message: `Your appointment #${appointment.appointmentNumber} has been rescheduled to ${slotStartTime} - ${slotEndTime}.`,
      type: 'booking',
      link: '/my-appointments',
    });

    await logAudit({
      user: req.user._id,
      action: 'APPOINTMENT_RESCHEDULED',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { oldSlot, newSlot: `${slotStartTime}-${slotEndTime}` },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      appointment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
};
