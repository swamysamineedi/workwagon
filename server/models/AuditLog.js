const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetEntity: {
      type: String,
      required: true, // e.g. 'User', 'ShopProfile', 'Vacancy', 'Report'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Storing before/after or extra metadata
    }
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ targetEntity: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
