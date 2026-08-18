const mongoose = require('mongoose');

/**
 * WorkerProfile
 *
 * Stores everything specific to a worker — who they are,
 * what they can do, where they are, and their availability.
 *
 * Kept separate from User because:
 *  - Workers can update their profile without touching auth
 *  - Shops searching for workers query this collection, not User
 *  - Skills and availability are worker-only concepts
 *
 * Embedded vs Referenced decisions:
 *  - skills:        embedded array — small, always queried with profile
 *  - availability:  embedded object — always queried together
 *  - location:      embedded — GeoJSON point for proximity searches
 *  - connections:   referenced (Connection model) — can grow large
 *
 * Relationships:
 *  - WorkerProfile N ─── 1 User
 *  - WorkerProfile 1 ─── N Request
 *  - WorkerProfile 1 ─── N Connection
 */
const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },

    // ── Identity ─────────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // ── Work Details ─────────────────────────────────────────────────────────
    skills: {
      // e.g. ["customer service", "barista", "forklift"]
      type: [String],
      default: [],
    },
    jobCategories: {
      // e.g. ["hospitality", "logistics", "retail"]
      // Enables vacancy matching by broad category
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
    },

    // ── Availability ─────────────────────────────────────────────────────────
    // Embedded: always read/written together, never independently queried
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      availableFrom: {
        type: Date,
      },
      preferredHours: {
        // e.g. "full-time", "part-time", "casual"
        type: String,
        enum: ['full-time', 'part-time', 'casual', 'flexible'],
        default: 'flexible',
      },
    },

    // ── Location ─────────────────────────────────────────────────────────────
    // Flat fields for city/region display and text filtering.
    // GeoJSON / 2dsphere proximity search reserved for a future phase.
    location: {
      city:    { type: String, trim: true },
      region:  { type: String, trim: true },
      country: { type: String, trim: true, default: 'Australia' },
    },

    // ── Profile Visibility ────────────────────────────────────────────────────
    isPublic: {
      type: Boolean,
      default: true, // Shops can discover this worker
    },
    profileCompleteness: {
      // 0–100 — calculated field, stored for sorting/filtering
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// user unique index is created automatically by unique:true on the field definition.
// Skills: Shops search "find workers with skill X"
workerProfileSchema.index({ skills: 1 });
// Job categories: broad category matching
workerProfileSchema.index({ jobCategories: 1 });
// Availability: Shops only want available workers
workerProfileSchema.index({ 'availability.isAvailable': 1 });
// isPublic + isAvailable: combined filter for shop-side discovery
workerProfileSchema.index({ isPublic: 1, 'availability.isAvailable': 1 });



const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);
module.exports = WorkerProfile;
