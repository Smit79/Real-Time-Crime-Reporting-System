const crypto           = require('crypto');
const User             = require('../models/User');
const AuditLog         = require('../models/AuditLog');
const ApiError         = require('../utils/apiError');
const ApiResponse      = require('../utils/apiResponse');
const asyncHandler     = require('../utils/asyncHandler');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const sendEmail        = require('../utils/sendEmail');
const jwt              = require('jsonwebtoken');
const {
  REFRESH_SECRET,
  NODE_ENV,
  CLIENT_URL,
  RESET_LINK_BASE_URL,
  VERIFY_LINK_BASE_URL,
} = require('../config/env');

const buildClientUrl = (req, path, fallbackBase) => {
  const requestOrigin = req.get('origin');
  const base = (requestOrigin && /^https?:\/\//i.test(requestOrigin)) ? requestOrigin : fallbackBase;
  return `${String(base || CLIENT_URL).replace(/\/+$/, '')}${path}`;
};

// ─── Helper: Attach tokens to cookies ────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message) => {
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure:   NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .cookie('accessToken',  accessToken,  { ...cookieOptions, maxAge: 7  * 24 * 60 * 60 * 1000 })
    .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .status(statusCode)
    .json(
      new ApiResponse(statusCode, {
        user: {
          _id:        user._id,
          fullName:   user.fullName,
          email:      user.email,
          phone:      user.phone,
          role:       user.role,
          avatar:     user.avatar,
          isVerified: user.isVerified,
        },
        accessToken,
      }, message)
    );
};

// ─── @desc    Register new user
// ─── @route   POST /api/v1/auth/register
// ─── @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { fullName, email, phone, password } = req.body;

  // Basic validation
  if (!fullName || !email || !password) {
    return next(new ApiError('Full name, email and password are required', 400));
  }

  const normalizedFullName = String(fullName).trim();
  if (!/^[A-Za-z ]+$/.test(normalizedFullName)) {
    return next(new ApiError('Full name can contain only letters and spaces', 400));
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ApiError('Email already registered', 409));
  }

  // Check if phone already exists (if provided)
  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return next(new ApiError('Phone number already registered', 409));
    }
  }

  // Public signup is always citizen; role promotions are admin-controlled.
  const assignedRole = 'citizen';

  // Generate email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');

  // Create user
  const user = await User.create({
    fullName:             normalizedFullName,
    email:                email.toLowerCase(),
    phone,
    password,
    role:                 assignedRole,
    passwordResetToken:   hashedToken,       // reusing field for email verify
    passwordResetExpires: Date.now() + 24 * 60 * 60 * 1000,  // 24 hrs
  });

  // Send verification email
  const verifyUrl = buildClientUrl(req, `/verify-email/${verifyToken}`, VERIFY_LINK_BASE_URL);

  try {
    await sendEmail({
      to:      user.email,
      subject: 'Verify your email — Crime Reporting',
      html: `
        <h2>Welcome, ${user.fullName}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" style="padding:10px 20px;background:#4F46E5;color:#fff;border-radius:5px;text-decoration:none;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not register, please ignore this email.</p>
      `,
    });
  } catch (err) {
    // Don't block registration if email fails
    console.error('Verification email error:', err.message);
  }

  // Audit log
  await AuditLog.create({
    performedBy: user._id,
    action:      'user_registered',
    targetType:  'User',
    targetId:    user._id,
    description: `New user registered: ${user.email}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  sendTokenResponse(user, 201, res, 'Registration successful. Please verify your email.');
});

// ─── @desc    Login user
// ─── @route   POST /api/v1/auth/login
// ─── @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError('Email and password are required', 400));
  }

  // Fetch user with password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return next(new ApiError('Invalid email or password', 401));
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ApiError('Invalid email or password', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ApiError('Your account has been deactivated. Contact support.', 403));
  }

  // Save refresh token to DB
  const refreshToken     = generateRefreshToken(user._id);
  user.refreshToken      = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Audit log
  await AuditLog.create({
    performedBy: user._id,
    action:      'user_login',
    targetType:  'User',
    targetId:    user._id,
    description: `User logged in: ${user.email}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ─── @desc    Logout user
// ─── @route   POST /api/v1/auth/logout
// ─── @access  Private
const logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: null },
  });

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'user_logout',
    targetType:  'User',
    targetId:    req.user._id,
    description: `User logged out: ${req.user.email}`,
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  // Clear cookies
  res
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .status(200)
    .json(new ApiResponse(200, null, 'Logged out successfully'));
});

// ─── @desc    Refresh access token using refresh token
// ─── @route   POST /api/v1/auth/refresh-token
// ─── @access  Private
const refreshToken = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken;

  if (!token) {
    return next(new ApiError('Refresh token not provided', 401));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, REFRESH_SECRET);
  } catch {
    return next(new ApiError('Invalid or expired refresh token', 401));
  }

  // Find user with matching refresh token
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    return next(new ApiError('Invalid refresh token', 401));
  }

  // Generate new tokens
  const newAccessToken  = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Save new refresh token
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure:   NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .cookie('accessToken',  newAccessToken,  { ...cookieOptions, maxAge: 7  * 24 * 60 * 60 * 1000 })
    .cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 })
    .status(200)
    .json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed successfully'));
});

// ─── @desc    Get current logged in user
// ─── @route   GET /api/v1/auth/me
// ─── @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  res.status(200).json(
    new ApiResponse(200, { user }, 'User fetched successfully')
  );
});

// ─── @desc    Update password
// ─── @route   PATCH /api/v1/auth/update-password
// ─── @access  Private
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError('Current and new password are required', 400));
  }

  if (newPassword.length < 6) {
    return next(new ApiError('New password must be at least 6 characters', 400));
  }

  if (currentPassword === newPassword) {
    return next(new ApiError('New password must be different from current password', 400));
  }

  // Fetch user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError('Current password is incorrect', 401));
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  // Audit log
  await AuditLog.create({
    performedBy: req.user._id,
    action:      'user_updated',
    targetType:  'User',
    targetId:    req.user._id,
    description: 'User changed their password',
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// ─── @desc    Forgot password — send reset email
// ─── @route   POST /api/v1/auth/forgot-password
// ─── @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError('Email is required', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, null, 'If this email exists, a reset link has been sent')
    );
  }

  // Generate reset token
  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;  // 15 mins
  await user.save({ validateBeforeSave: false });

  // Send email
  const resetUrl = buildClientUrl(req, `/reset-password/${resetToken}`, RESET_LINK_BASE_URL);

  try {
    await sendEmail({
      to:      user.email,
      subject: 'Password Reset Request — Crime Reporting',
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${user.fullName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="padding:10px 20px;background:#4F46E5;color:#fff;border-radius:5px;text-decoration:none;">
          Reset Password
        </a>
        <p>This link expires in <strong>15 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json(
      new ApiResponse(200, null, 'If this email exists, a reset link has been sent')
    );
  } catch (err) {
    console.error('Forgot password email error:', err.message);

    if (NODE_ENV !== 'production') {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            debug: {
              resetToken,
              resetUrl,
              emailError: err.message,
            },
          },
          'Email service unavailable in development. Use debug reset token.'
        )
      );
    }

    // Rollback token if email fails in production
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError('Email could not be sent. Try again later.', 500));
  }
});

// ─── @desc    Reset password using token
// ─── @route   POST /api/v1/auth/reset-password/:token
// ─── @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ApiError('New password is required', 400));
  }

  if (password.length < 6) {
    return next(new ApiError('Password must be at least 6 characters', 400));
  }

  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Invalid or expired reset token', 400));
  }

  // Update password
  user.password             = password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = null;        // invalidate all sessions
  await user.save();

  // Audit log
  await AuditLog.create({
    performedBy: user._id,
    action:      'user_updated',
    targetType:  'User',
    targetId:    user._id,
    description: 'User reset their password via email link',
    ipAddress:   req.ip,
    userAgent:   req.headers['user-agent'],
  });

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// ─── @desc    Verify email using token
// ─── @route   POST /api/v1/auth/verify-email/:token
// ─── @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Invalid or expired verification link', 400));
  }

  // Mark as verified
  user.isVerified           = true;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await sendEmail({
      to:      user.email,
      subject: 'Email Verified — Welcome to Crime Reporting!',
      html: `
        <h2>Email Verified!</h2>
        <p>Hi ${user.fullName}, your email has been verified successfully.</p>
        <p>You can now use all features of the Crime Reporting platform.</p>
        <p>Stay safe!</p>
      `,
    });
  } catch (err) {
    console.error('Welcome email error:', err.message);
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Email verified successfully')
  );
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};