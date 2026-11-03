const VolunteerAssignment = require('../models/VolunteerAssignment');
const Camp = require('../models/Camp');
const Notification = require('../models/Notification');
const { logAudit } = require('../utils/auditLogger');

// @desc    Assign a volunteer to a camp shift
// @route   POST /api/volunteers/assignments
// @access  Private (Admin or Coordinator)
const assignVolunteer = async (req, res, next) => {
  try {
    const { campId, volunteerId, shiftStartTime, shiftEndTime, roleTitle, responsibilities = [] } = req.body;

    if (!campId || !volunteerId || !shiftStartTime || !shiftEndTime || !roleTitle) {
      return res.status(400).json({
        success: false,
        message: 'Camp ID, volunteer ID, shift start time, shift end time, and role title are required.',
      });
    }

    const camp = await Camp.findById(campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    // Check for overlapping shift assignments on the same camp
    const existingSameCampAssignment = await VolunteerAssignment.findOne({
      camp: campId,
      volunteer: volunteerId,
      status: { $nin: ['declined', 'absent'] },
    });

    if (existingSameCampAssignment) {
      return res.status(409).json({
        success: false,
        message: 'This volunteer is already assigned to a shift at this camp.',
      });
    }

    const assignment = await VolunteerAssignment.create({
      camp: campId,
      volunteer: volunteerId,
      shiftStartTime,
      shiftEndTime,
      roleTitle,
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [responsibilities],
      status: 'assigned',
    });

    // Notify the volunteer
    await Notification.create({
      recipient: volunteerId,
      title: 'New Volunteer Shift Assignment',
      message: `You have been assigned to ${roleTitle} for camp ${camp.name} on ${new Date(camp.date).toLocaleDateString()} (${shiftStartTime} - ${shiftEndTime}).`,
      type: 'shift',
      link: '/volunteer-shifts',
    });

    await logAudit({
      user: req.user._id,
      action: 'VOLUNTEER_ASSIGNED',
      entityType: 'VolunteerAssignment',
      entityId: assignment._id,
      details: { campId, volunteerId, roleTitle, shift: `${shiftStartTime}-${shiftEndTime}` },
      req,
    });

    const populated = await VolunteerAssignment.findById(assignment._id)
      .populate('camp', 'name venue address city date')
      .populate('volunteer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Volunteer assigned successfully.',
      assignment: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteer assignments
// @route   GET /api/volunteers/assignments
// @access  Private (Volunteer sees own, Admin/Coordinator can filter)
const getAssignments = async (req, res, next) => {
  try {
    const { campId, volunteerId, status } = req.query;
    const query = {};

    if (req.user.role === 'volunteer') {
      query.volunteer = req.user._id;
    } else if (volunteerId) {
      query.volunteer = volunteerId;
    }

    if (campId) query.camp = campId;
    if (status && status !== 'all') query.status = status;

    const assignments = await VolunteerAssignment.find(query)
      .populate('camp', 'name venue address city date startTime endTime status contactPerson contactPhone')
      .populate('volunteer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update assignment status (accept/confirm, decline, check-in, check-out)
// @route   PUT /api/volunteers/assignments/:id/status
// @access  Private (Assigned Volunteer, Admin, Coordinator)
const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { status, checkIn, checkOut, notes } = req.body;
    const assignment = await VolunteerAssignment.findById(req.params.id).populate('camp');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer assignment not found',
      });
    }

    // Role check: Volunteers can confirm or decline their own assignment
    if (req.user.role === 'volunteer') {
      if (assignment.volunteer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You can only update your own shift assignment.',
        });
      }
      if (['attended', 'absent'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Attendance verification must be marked by the camp coordinator or admin.',
        });
      }
    }

    if (status) assignment.status = status;
    if (notes !== undefined) assignment.notes = notes;

    if (checkIn) {
      assignment.checkInTime = new Date();
      assignment.status = 'attended';
    }

    if (checkOut) {
      assignment.checkOutTime = new Date();
      if (assignment.checkInTime) {
        const diffMs = assignment.checkOutTime - assignment.checkInTime;
        assignment.hoursLogged = Number((diffMs / (1000 * 60 * 60)).toFixed(1));
      }
    }

    await assignment.save();

    await logAudit({
      user: req.user._id,
      action: 'VOLUNTEER_STATUS_UPDATED',
      entityType: 'VolunteerAssignment',
      entityId: assignment._id,
      details: { status: assignment.status },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer assignment updated successfully.',
      assignment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assignVolunteer,
  getAssignments,
  updateAssignmentStatus,
};
