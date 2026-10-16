const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and set to field
    user.resetPasswordOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const message = `
      <h1>Password Reset OTP</h1>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
      <p>Your OTP for password reset is:</p>
      <h2 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h2>
      <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    const smtpSettings = [
      process.env.SMTP_HOST,
      process.env.SMTP_USER,
      process.env.SMTP_PASS,
      process.env.FROM_EMAIL,
    ];
    const hasValidSmtp = smtpSettings.every(
      (value) => value && value.trim() && !value.includes('your_')
    );

    if (hasValidSmtp) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Password Reset OTP',
          message,
        });
      } catch (err) {
        console.error('Failed to send password reset email:', err);
        return res.status(502).json({
          message: 'Unable to send password reset email. Please try again later.',
        });
      }

      return res.status(200).json({ message: 'OTP sent to email' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('--- PASSWORD RESET OTP ---');
      console.log(`OTP: ${otp}`);
      console.log('---------------------------');
      return res.status(200).json({
        message: 'OTP sent (Development Mode: Check server console)',
        developmentOTP: otp,
      });
    }

    console.error('SMTP is not configured; password reset email cannot be sent.');
    return res.status(503).json({
      message: 'Password reset email service is not configured.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset Password
// @route   PUT /api/users/resetpassword
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    // Get hashed OTP
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;

    await user.save();

    res.status(200).json({
      message: 'Password reset successful',
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Password validation helper
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) return 'Password must be at least 8 characters long';
  if (!hasUppercase) return 'Password must contain at least one uppercase letter';
  if (!hasLowercase) return 'Password must contain at least one lowercase letter';
  if (!hasNumber) return 'Password must contain at least one number';
  if (!hasSpecialChar) return 'Password must contain at least one special character';
  return null;
};

// @desc    Register user
// @route   POST /api/users/signup
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, collegeName, role, department, mobileNo, contactEmail } = req.body;

  if (!name || !email || !password || (role !== 'admin' && !collegeName)) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  // Validate password strength
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  // Check if user exists
  const userExists = await User.findOne({ 
    $or: [
      { email: email.toLowerCase() },
      { name: { $regex: new RegExp(`^${name}$`, 'i') } }
    ]
  });

  if (userExists) {
    const message = userExists.email === email.toLowerCase() 
      ? 'User already exists with this email' 
      : 'User already exists with this name';
    return res.status(400).json({ message });
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    collegeName,
    role: role || 'student',
    isApproved: role === 'admin' ? true : false, // Organizers AND Students both require admin approval!
    organizerDetails: role === 'organizer' ? {
      department,
      mobileNo,
      contactEmail,
    } : undefined,
  });

  if (user) {
    // If user is not admin (student or organizer), don't return token yet, wait for approval
    if (user.role !== 'admin') {
      const roleLabel = user.role === 'organizer' ? 'Organizer' : 'Student';
      return res.status(201).json({
        message: `${roleLabel} account created successfully. Please wait for Admin approval before logging in.`,
        role: user.role,
        _id: user.id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        isApproved: false,
        organizerDetails: user.organizerDetails,
      });
    }

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      studentDetails: user.studentDetails,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(401).json({ message: 'No user found kindly Signup First!' });
  }

  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) {
      return res.status(403).json({
        message: 'You have been banned by the college admin. Please contact your college administration or department head for assistance.',
        isBlocked: true,
        blockReason: user.blockReason || 'Banned by college administration',
      });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      const roleLabel = user.role === 'organizer' ? 'Organizer' : 'Student';
      return res.status(401).json({ message: `${roleLabel} account pending approval by Admin` });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeName: user.collegeName,
      studentDetails: user.studentDetails,
      organizerDetails: user.organizerDetails,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    console.log('Update Profile Request:', req.body);
    const user = await User.findById(req.user._id);

    if (user) {
      // Safety check for collegeName which is required for non-admins
      if (user.role !== 'admin' && !user.collegeName) {
        console.warn('User missing collegeName, setting a default for safety');
        user.collegeName = 'Unknown College';
      }

      if (user.role === 'student') {
        user.studentDetails = {
          class: req.body.class || (user.studentDetails && user.studentDetails.class),
          rollNo: req.body.rollNo || (user.studentDetails && user.studentDetails.rollNo),
          branch: req.body.branch || (user.studentDetails && user.studentDetails.branch),
          year: req.body.year || (user.studentDetails && user.studentDetails.year),
          mobileNo: req.body.mobileNo || (user.studentDetails && user.studentDetails.mobileNo),
        };
      } else if (user.role === 'organizer') {
        user.organizerDetails = {
          department: req.body.department || (user.organizerDetails && user.organizerDetails.department),
          mobileNo: req.body.mobileNo || (user.organizerDetails && user.organizerDetails.mobileNo),
          contactEmail: req.body.contactEmail || (user.organizerDetails && user.organizerDetails.contactEmail),
        };
      }

      const updatedUser = await user.save();
      console.log('User Profile Updated Successfully');

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        collegeName: updatedUser.collegeName,
        studentDetails: updatedUser.studentDetails,
        organizerDetails: updatedUser.organizerDetails,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update Profile Error Name:', error.name);
    console.error('Update Profile Error Message:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`));
    }
    res.status(500).json({ message: 'Server error while updating profile: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};
