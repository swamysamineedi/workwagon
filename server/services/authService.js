const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const ShopProfile = require('../models/ShopProfile');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

// ─── Register ─────────────────────────────────────────────────────────────────

const register = async (body) => {
  const { email, password, role, firstName, lastName, businessName } = body;

  if (!['worker', 'shop'].includes(role)) {
    throw new AppError('Role must be worker or shop. Admin accounts cannot be self-registered.', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Role-specific field validation
  if (role === 'worker' && (!firstName?.trim() || !lastName?.trim())) {
    throw new AppError('First name and last name are required for worker registration.', 400);
  }
  if (role === 'shop' && !businessName?.trim()) {
    throw new AppError('Business name is required for shop registration.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
  });

  try {
    if (role === 'worker') {
      await WorkerProfile.create({
        user: user._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } else {
      await ShopProfile.create({
        user: user._id,
        businessName: businessName.trim(),
      });
    }
  } catch (profileErr) {
    // Roll back user creation if profile creation fails
    await User.findByIdAndDelete(user._id);
    throw new AppError('Registration failed. Please try again.', 500);
  }

  const token = signToken(user._id, user.role);
  return { token, user: safeUser(user) };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Same error for wrong email or wrong password — prevents user enumeration
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id, user.role);
  return { token, user: safeUser(user) };
};

// ─── Get Current User ─────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return safeUser(user);
};

module.exports = { register, login, getMe };
