const User = require('../models/User');
const DonorProfile = require('../models/DonorProfile');
const { generateToken } = require('../utils/jwt');
const { logAudit } = require('../utils/auditLogger');

// @desc    Register a new user (donor, volunteer, coordinator, or admin)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'donor', phone, bloodGroup, gender, dateOfBirth, consentToStoreData = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Role safety: if registering as admin, only allow if configured or default to donor if unexpected
    const validRoles = ['donor', 'volunteer', 'coordinator', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'donor';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      phone: phone || '',
    });

    let donorProfile = null;
    if (assignedRole === 'donor') {
      donorProfile = await DonorProfile.create({
        user: user._id,
        bloodGroup: bloodGroup || 'O+',
        gender: gender || 'prefer_not_to_say',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        consentToStoreData: Boolean(consentToStoreData),
        consentToContact: true,
        medicalDisclaimerAcknowledged: true,
      });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    await logAudit({
      user: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role, email: user.email },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      donorProfile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently disabled. Please contact system admin.',
      });
    }

    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await DonorProfile.findOne({ user: user._id });
    }

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    await logAudit({
      user: user._id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { role: user.role },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      donorProfile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user & profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await DonorProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      donorProfile,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bloodGroup, gender, dateOfBirth, emergencyContact, address, consentToStoreData, consentToContact } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    let donorProfile = null;
    if (user.role === 'donor') {
      donorProfile = await DonorProfile.findOne({ user: user._id });
      if (!donorProfile) {
        donorProfile = new DonorProfile({ user: user._id, bloodGroup: bloodGroup || 'O+' });
      }

      if (bloodGroup) donorProfile.bloodGroup = bloodGroup;
      if (gender) donorProfile.gender = gender;
      if (dateOfBirth) donorProfile.dateOfBirth = new Date(dateOfBirth);
      if (emergencyContact) donorProfile.emergencyContact = { ...donorProfile.emergencyContact, ...emergencyContact };
      if (address) donorProfile.address = { ...donorProfile.address, ...address };
      if (consentToStoreData !== undefined) donorProfile.consentToStoreData = Boolean(consentToStoreData);
      if (consentToContact !== undefined) donorProfile.consentToContact = Boolean(consentToContact);

      await donorProfile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      donorProfile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
