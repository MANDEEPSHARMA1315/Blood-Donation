const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all users with search & role filter
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
        { phone: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Also populate donor profile info for donors
    const userIds = users.map((u) => u._id);
    const profiles = await DonorProfile.find({ user: { $in: userIds } });
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    const enrichedUsers = users.map((u) => ({
      ...u.toObject(),
      donorProfile: profileMap[u._id.toString()] || null,
    }));

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users: enrichedUsers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'donor', 'volunteer', 'coordinator'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`,
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit({
      user: req.user._id,
      action: 'USER_ROLE_UPDATED',
      entityType: 'User',
      entityId: user._id,
      details: { oldRole, newRole: role, userEmail: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User role updated from ${oldRole} to ${role}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-deactivation for safety
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      user: req.user._id,
      action: 'USER_STATUS_TOGGLED',
      entityType: 'User',
      entityId: user._id,
      details: { isActive: user.isActive, userEmail: user.email },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User account is now ${user.isActive ? 'active' : 'deactivated'}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get audit logs
// @route   GET /api/users/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 25 } = req.query;
    const query = {};

    if (action && action !== 'all') query.action = action;
    if (entityType && entityType !== 'all') query.entityType = entityType;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
};
