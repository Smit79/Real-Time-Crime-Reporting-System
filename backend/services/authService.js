const crypto       = require('crypto');
const User         = require('../models/User');
const ApiError     = require('../utils/apiError');
const sendEmail    = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { CLIENT_URL } = require('../config/env');

// ─── Register new user ────────────────────────────────────────────────────────
const registerUser = async ({ fullName, email, phone, password, role }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError('Email already registered', 409);

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) throw new ApiError('Phone number already registered', 409);
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

  const user = await User.create({
    fullName,
    email:                email.toLowerCase(),
    phone,
    password,
    role:                 role === 'admin' ? 'citizen' : role || 'citizen',
    passwordResetToken:   hashedToken,
    passwordResetExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  return { user, verifyToken };
};

// ─── Login user ───────────────────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new ApiError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError('Invalid email or password', 401);

  if (!user.isActive) throw new ApiError('Account deactivated. Contact support.', 403);

  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

// ─── Send verification email ──────────────────────────────────────────────────
const sendVerificationEmail = async (user, verifyToken) => {
  const verifyUrl = `${CLIENT_URL}/verify-email/${verifyToken}`;

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
    `,
  });
};

// ─── Send password reset email ────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to:      user.email,
    subject: 'Password Reset — Crime Reporting',
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${user.fullName},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="padding:10px 20px;background:#4F46E5;color:#fff;border-radius:5px;text-decoration:none;">
        Reset Password
      </a>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
};

// ─── Generate password reset token ───────────────────────────────────────────
const generatePasswordResetToken = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken   = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  return { user, resetToken };
};

// ─── Verify email token ───────────────────────────────────────────────────────
const verifyEmailToken = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError('Invalid or expired verification link', 400);

  user.isVerified           = true;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

// ─── Reset password ───────────────────────────────────────────────────────────
const resetUserPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError('Invalid or expired reset token', 400);

  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = null;
  await user.save();

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  sendVerificationEmail,
  sendPasswordResetEmail,
  generatePasswordResetToken,
  verifyEmailToken,
  resetUserPassword,
};