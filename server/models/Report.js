const mongoose = require('mongoose');

/**
 * Report
 *
 * A user report against another user or content entity.
 * Managed by Admin. Kept as a separate collection because:
 *  - Reports are admin-only queries — separate collection avoids cluttering other models
 *  - Volume can grow independently of user/vacancy data
 *  - Reports need their own status lifecycle (pending, reviewed, actioned)
 *
 * Relationships:
 *  - Report N ─── 1 User (reporter)
 *  - Report N ─── 1 User (reportedUser) OR any entity (polymorphic)
 *  - Report N ─── 0|1 User (resolvedBy admin)
 */
const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Polymorphic — can report a Vacancy, Request, Connection, User, etc.
    refModel: {
      type: String,
      enum: ['User', 'Vacancy', 'Request', 'Connection'],
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reason: {
      type: String,
      enum: {
        values: [
          'spam',
          'inappropriate_content',
          'fake_profile',
          'harassment',
          'misleading_vacancy',
          'other',
        ],
        message: 'Invalid report reason',
      },
      required: [true, 'Report reason is required'],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin user
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// status: admin queue — "show pending reports"
reportSchema.index({ status: 1 });
// reporter: "reports I submitted"
reportSchema.index({ reporter: 1 });
// reportedUser: "reports against this user"
reportSchema.index({ reportedUser: 1 });
// createdAt: admin sees newest reports first
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
