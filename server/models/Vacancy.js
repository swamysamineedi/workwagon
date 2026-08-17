const mongoose = require('mongoose');

/**
 * Vacancy
 *
 * A job opportunity posted by a Shop.
 * Has a slot system: totalSlots defines capacity,
 * filledSlots tracks how many connections have been made.
 *
 * SLOT DESIGN DECISION:
 *   availableSlots = totalSlots - filledSlots
 *   → availableSlots is NOT stored — it is a virtual (calculated) field.
 *
 *   Reason: storing it would require keeping three numbers in sync atomically.
 *   Storing only totalSlots + filledSlots means there is one source of truth.
 *   The virtual is fast (pure subtraction, no DB read) and always consistent.
 *   filledSlots is only incremented by the Connection creation service,
 *   never directly by API consumers, preventing drift.
 *
 * STATUS TRANSITIONS:
 *   draft → open → filled (when filledSlots === totalSlots)
 *                → closed (manually by shop or admin)
 *                → expired (when expiresAt passes)
 *
 * Relationships:
 *  - Vacancy N ─── 1 ShopProfile
 *  - Vacancy 1 ─── N Request
 *  - Vacancy 1 ─── N Connection
 */
const vacancySchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopProfile',
      required: [true, 'Vacancy must belong to a shop'],
    },
    postedBy: {
      // User reference for auth-layer checks (avoids ShopProfile populate just for auth)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Job Details ───────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Vacancy title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Vacancy description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      // e.g. "hospitality", "logistics", "retail"
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'casual', 'contract'],
      required: [true, 'Employment type is required'],
    },
    payRate: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'AUD' },
      period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'annually'],
        default: 'hourly',
      },
    },

    // ── Slot System ───────────────────────────────────────────────────────────
    totalSlots: {
      type: Number,
      required: [true, 'Total slots are required'],
      min: [1, 'A vacancy must have at least 1 slot'],
      max: [100, 'A vacancy cannot have more than 100 slots'],
    },
    filledSlots: {
      // Only modified by the Connection service — never by direct API input
      type: Number,
      default: 0,
      min: [0, 'Filled slots cannot be negative'],
    },
    // availableSlots is a virtual — see schema.virtual below

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['draft', 'open', 'filled', 'closed', 'expired'],
        message: 'Invalid vacancy status',
      },
      default: 'draft',
    },

    // ── Scheduling ────────────────────────────────────────────────────────────
    startsAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },

    // ── Location (can differ from shop location for multi-site businesses) ────
    location: {
      city: { type: String, trim: true },
      region: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Australia' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // Include virtuals in JSON output
    toObject: { virtuals: true },
  }
);

// ─── Virtual: availableSlots ──────────────────────────────────────────────────
// Calculated, never stored — single source of truth, always consistent
vacancySchema.virtual('availableSlots').get(function () {
  return Math.max(0, this.totalSlots - this.filledSlots);
});

// ─── Middleware: auto-fill status when slots fill ─────────────────────────────
vacancySchema.pre('save', function (next) {
  if (this.filledSlots >= this.totalSlots) {
    this.status = 'filled';
  }
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// shop: "find all vacancies for this shop" — very common query
vacancySchema.index({ shop: 1 });
// status: workers browse open vacancies
vacancySchema.index({ status: 1 });
// category: workers filter by category
vacancySchema.index({ category: 1 });
// compound: open vacancies in a category — the most common worker browse query
vacancySchema.index({ status: 1, category: 1 });
// skills: match against worker skills
vacancySchema.index({ requiredSkills: 1 });
// expiresAt: background job finds expired vacancies to close
vacancySchema.index({ expiresAt: 1 });

const Vacancy = mongoose.model('Vacancy', vacancySchema);
module.exports = Vacancy;
