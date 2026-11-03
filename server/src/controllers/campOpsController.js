const Camp = require('../models/Camp');
const Appointment = require('../models/Appointment');
const DonationRecord = require('../models/DonationRecord');
const DonorProfile = require('../models/DonorProfile');
const CampTask = require('../models/CampTask');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// Generate unique Bag Number: BAG-YYYY-XXXXX
const generateBagNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `BAG-${year}-${random}`;
};

// @desc    Check-in registered donor at camp desk
// @route   PUT /api/camp-ops/appointments/:id/check-in
// @access  Private (Coordinator, Admin)
const checkInDonor = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('camp')
      .populate('donor', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in a cancelled appointment.',
      });
    }

    if (appointment.status === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Donor is already checked in.',
      });
    }

    appointment.status = 'checked_in';
    await appointment.save();

    await Camp.findByIdAndUpdate(appointment.camp._id, {
      $inc: { checkedInCount: 1 },
    });

    await logAudit({
      user: req.user._id,
      action: 'DONOR_CHECKED_IN',
      entityType: 'Appointment',
      entityId: appointment._id,
      details: { donorName: appointment.donor.name, campId: appointment.camp._id },
      req,
    });

    res.status(200).json({
      success: true,
      message: `${appointment.donor.name} checked in successfully.`,
      appointment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record completed donation or medical deferral
// @route   POST /api/camp-ops/donations
// @access  Private (Coordinator, Admin)
const recordDonation = async (req, res, next) => {
  try {
    const {
      appointmentId,
      bloodGroup,
      unitsCollected = 1,
      volumeMl = 450,
      hemoglobinLevel = 13.5,
      bloodPressure = '120/80',
      pulseRate = 72,
      weightKg = 65,
      phlebotomistName = 'Dr. Sharma / Staff Phlebotomist',
      donationStatus = 'successful',
      deferralReason = '',
      postDonationAdverseEvent = false,
      adverseNotes = '',
    } = req.body;

    if (!appointmentId || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and Blood Group are required.',
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('camp')
      .populate('donor');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if donation record already exists
    const existingRecord = await DonationRecord.findOne({ appointment: appointmentId });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'A donation record has already been logged for this appointment.',
      });
    }

    const bagNumber = generateBagNumber();

    const donationRecord = await DonationRecord.create({
      camp: appointment.camp._id,
      appointment: appointment._id,
      donor: appointment.donor._id,
      bloodGroup,
      unitsCollected: donationStatus === 'successful' ? Number(unitsCollected) : 0,
      volumeMl: donationStatus === 'successful' ? Number(volumeMl) : 0,
      hemoglobinLevel: Number(hemoglobinLevel),
      bloodPressure,
      pulseRate: Number(pulseRate),
      weightKg: Number(weightKg),
      phlebotomistName,
      verifiedBy: req.user._id,
      donationStatus,
      deferralReason: donationStatus === 'deferred' ? deferralReason : '',
      bagNumber,
      postDonationAdverseEvent: Boolean(postDonationAdverseEvent),
      adverseNotes: adverseNotes || '',
    });

    // Update appointment status
    appointment.status = donationStatus === 'successful' ? 'completed' : 'checked_in';
    appointment.medicalCheckNotes = donationStatus === 'deferred' ? `Deferred: ${deferralReason}` : 'Eligible & Completed';
    await appointment.save();

    // If successful donation, update camp completed count & donor profile
    if (donationStatus === 'successful') {
      await Camp.findByIdAndUpdate(appointment.camp._id, {
        $inc: { completedDonationsCount: 1 },
      });

      // Update donor profile
      const eligibleDate = new Date();
      eligibleDate.setDate(eligibleDate.getDate() + 90); // 90 days deferral interval

      await DonorProfile.findOneAndUpdate(
        { user: appointment.donor._id },
        {
          bloodGroup,
          lastDonationDate: new Date(),
          $inc: { totalDonationsCount: 1 },
          eligibleToDonateAfter: eligibleDate,
        },
        { upsert: true }
      );

      // Notification to donor
      await Notification.create({
        recipient: appointment.donor._id,
        title: 'Thank You for Donating Blood!',
        message: `Your donation of ${unitsCollected} unit(s) (${bloodGroup}) at ${appointment.camp.name} was successfully completed! Bag Ref: #${bagNumber}. You are saving lives!`,
        type: 'booking',
        link: '/my-appointments',
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'DONATION_RECORDED',
      entityType: 'DonationRecord',
      entityId: donationRecord._id,
      details: {
        donationStatus,
        bloodGroup,
        unitsCollected,
        bagNumber,
        campId: appointment.camp._id,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: donationStatus === 'successful' ? 'Donation recorded successfully.' : 'Donor deferral recorded.',
      donationRecord,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get operational tasks and checklist for a camp
// @route   GET /api/camp-ops/camps/:campId/tasks
// @access  Private (Coordinator, Admin, Volunteer)
const getCampTasks = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = { camp: req.params.campId };
    if (category && category !== 'all') query.category = category;

    const tasks = await CampTask.find(query)
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a checklist or equipment supply task
// @route   POST /api/camp-ops/camps/:campId/tasks
// @access  Private (Coordinator, Admin)
const createCampTask = async (req, res, next) => {
  try {
    const { title, category = 'readiness', assignedTo, priority = 'medium', quantity = 1, notes = '' } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.',
      });
    }

    const task = await CampTask.create({
      camp: req.params.campId,
      title,
      category,
      assignedTo: assignedTo || null,
      priority,
      quantity: Number(quantity),
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      task,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle task completed status
// @route   PUT /api/camp-ops/tasks/:id/toggle
// @access  Private (Coordinator, Admin, Volunteer)
const toggleCampTask = async (req, res, next) => {
  try {
    const task = await CampTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    task.completedBy = task.isCompleted ? req.user._id : null;
    await task.save();

    res.status(200).json({
      success: true,
      message: `Task marked as ${task.isCompleted ? 'completed' : 'pending'}.`,
      task,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get printable/exportable camp attendance sheet
// @route   GET /api/camp-ops/camps/:campId/attendance-sheet
// @access  Private (Coordinator, Admin)
const getCampAttendanceSheet = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.campId).populate('coordinators', 'name email phone');
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    const appointments = await Appointment.find({ camp: camp._id })
      .populate('donor', 'name email phone')
      .populate('donorProfile', 'bloodGroup dateOfBirth gender totalDonationsCount')
      .sort({ slotStartTime: 1, createdAt: 1 });

    const donationRecords = await DonationRecord.find({ camp: camp._id });
    const donationMap = {};
    donationRecords.forEach((d) => {
      donationMap[d.appointment.toString()] = d;
    });

    const rows = appointments.map((appt, idx) => {
      const dRec = donationMap[appt._id.toString()];
      return {
        srNo: idx + 1,
        appointmentNumber: appt.appointmentNumber,
        slot: `${appt.slotStartTime} - ${appt.slotEndTime}`,
        donorName: appt.donor?.name || 'N/A',
        donorPhone: appt.donor?.phone || 'N/A',
        donorEmail: appt.donor?.email || 'N/A',
        bloodGroup: appt.donorProfile?.bloodGroup || dRec?.bloodGroup || 'Pending',
        status: appt.status,
        bagNumber: dRec?.bagNumber || '-',
        unitsCollected: dRec?.unitsCollected || 0,
        donationStatus: dRec?.donationStatus || (appt.status === 'completed' ? 'successful' : 'pending'),
      };
    });

    res.status(200).json({
      success: true,
      camp,
      attendanceStats: {
        totalAppointments: appointments.length,
        checkedIn: appointments.filter((a) => ['checked_in', 'completed'].includes(a.status)).length,
        completed: appointments.filter((a) => a.status === 'completed').length,
        cancelled: appointments.filter((a) => a.status === 'cancelled').length,
        pending: appointments.filter((a) => a.status === 'confirmed').length,
      },
      rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkInDonor,
  recordDonation,
  getCampTasks,
  createCampTask,
  toggleCampTask,
  getCampAttendanceSheet,
};
