const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET } = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookie
  else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new ApiError('Not authorized, no token provided', 401));
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);

  // Check user still exists
  const user = await User.findById(decoded.id).select('-password -refreshToken');
  if (!user) {
    return next(new ApiError('User no longer exists', 401));
  }

  // Check user is active
  if (!user.isActive) {
    return next(new ApiError('Your account has been deactivated', 401));
  }

  req.user = user;
  next();
});

module.exports = { protect };