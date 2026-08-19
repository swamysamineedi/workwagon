const mongoose = require('mongoose');

/**
 * ShopProfile
 *
 * Stores everything specific to a shop/business.
 * Shops post vacancies and can discover/request workers.
 *
 * Embedded vs Referenced decisions:
 *  - location:    embedded — GeoJSON for proximity, always used together
 *  - openingHours: embedded — small, always returned with profile
 *  - vacancies:   referenced (Vacancy model) — can grow large, queried independently
 *  - connections: referenced (Connection model) — queried independently
 *
 * Relationships:
 *  - ShopProfile N ─── 1 User
 *  - ShopProfile 1 ─── N Vacancy
 *  - ShopProfile 1 ─── N Request (outgoing + incoming)
 *  - ShopProfile 1 ─── N Connection
 */
const shopProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
    },

    // ── Business Identity ─────────────────────────────────────────────────────
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [100, 'Business name cannot exceed 100 characters'],
    },
    businessType: {
      // e.g. "cafe", "warehouse", "retail store"
      type: String,
      trim: true,
      maxlength: [50, 'Business type cannot exceed 50 characters'],
    },
    industry: {
      // e.g. "hospitality", "logistics", "retail"
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    abn: {
      // Australian Business Number — optional verification field
      type: String,
      trim: true,
    },

    // ── Location ─────────────────────────────────────────────────────────────
    // Simplified location (GeoJSON removed due to registration index conflicts)
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      region: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Australia' },
      postcode: { type: String, trim: true },
    },

    // ── Operational Details ───────────────────────────────────────────────────
    openingHours: {
      // Embedded — always returned with shop profile, never queried alone
      monday: { type: String },
      tuesday: { type: String },
      wednesday: { type: String },
      thursday: { type: String },
      friday: { type: String },
      saturday: { type: String },
      sunday: { type: String },
    },

    // ── Trust & Verification ──────────────────────────────────────────────────
    verificationStatus: {
      // Admin verification lifecycle
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who verified/rejected
    },
    isPublic: {
      // Controls worker discoverability
      type: Boolean,
      default: true,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Stats (denormalized for dashboard performance) ────────────────────────
    // These are updated when vacancies/connections change — avoids expensive aggregations
    totalVacanciesPosted: {
      type: Number,
      default: 0,
    },
    activeVacancies: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// user unique index is created automatically by unique:true on the field definition.
// Industry — workers filtering by industry
shopProfileSchema.index({ industry: 1 });
// isPublic + verificationStatus — worker-side discovery filter
shopProfileSchema.index({ isPublic: 1, verificationStatus: 1 });
// businessName text — search autocomplete
shopProfileSchema.index({ businessName: 'text' });


const ShopProfile = mongoose.model('ShopProfile', shopProfileSchema);
module.exports = ShopProfile;
