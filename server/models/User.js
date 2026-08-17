const mongoose = require('mongoose');

/**
 * User
 *
 * Stores authentication credentials and role only.
 * Profile-specific data (name, bio, skills, etc.) lives in
 * WorkerProfile or ShopProfile, referenced by this document.
 *
 * This separation means:
 *  - Auth logic never touches profile data
 *  - Profile queries never need to load credentials
 *  - Role-based authorization works purely from this model
 *
 * Relationships:
 *  - User 1 ─── 0|1 WorkerProfile
 *  - User 1 ─── 0|1 ShopProfile
 *  - User 1 ─── N  Notification
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['worker', 'shop', 'admin'],
        message: 'Role must be worker, shop, or admin',
      },
      required: [true, 'Role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// email: unique — enforced in schema, but explicit index for query performance
userSchema.index({ email: 1 }, { unique: true });
// role: frequently filtered (e.g. "find all workers", admin dashboards)
userSchema.index({ role: 1 });
// isActive + role: compound — "find all active workers/shops"
userSchema.index({ isActive: 1, role: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
