const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * protect
 * Verifies Bearer JWT, loads user from DB, attaches to req.user.
 * Returns 401 for all unauthenticated/invalid cases.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    return next(new AppError('The account belonging to this token no longer exists.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  req.user = user;
  next();
});

/**
 * requireRole(...roles)
 * Must be used after protect.
 * Returns 403 if the authenticated user's role is not in the allowed list.
 *
 * Usage:
 *   router.get('/admin-only', protect, requireRole('admin'), handler)
 *   router.get('/worker-area', protect, requireRole('worker'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. This resource requires: ${roles.join(' or ')} role.`,
        403
      )
    );
  }
  next();
};

module.exports = { protect, requireRole };
