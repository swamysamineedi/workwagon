const mongoose = require('mongoose');

/**
 * Notification
 *
 * In-app notification for a user. Created by the service layer
 * when key events occur (new request, mutual match, vacancy update, etc.).
 *
 * DESIGN DECISION — separate collection vs embedded in User:
 *   Separate collection is correct here because:
 *   - Notifications can accumulate (hundreds over time)
 *   - They are queried independently ("get my unread notifications")
 *   - They are marked read individually
 *   - Embedding in User would bloat the User document badly
 *
 * Relationships:
 *  - Notification N ─── 1 User (recipient)
 *  - Notification N ─── 0|1 any entity (refId polymorphic reference)
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'request_received',    // Someone sent you a request
          'request_accepted',    // Your request was accepted
          'request_rejected',    // Your request was rejected
          'request_cancelled',   // Sender withdrew their request
          'mutual_match',        // Both sides matched — connection created
          'connection_ended',    // A connection was ended
          'vacancy_filled',      // A vacancy you applied to is now full
          'admin_message',       // Message from admin
        ],
        message: 'Invalid notification type',
      },
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    body: {
      type: String,
      maxlength: 500,
    },
    // Polymorphic reference to the related entity (Request, Connection, Vacancy, etc.)
    refModel: {
      type: String,
      enum: ['Request', 'Connection', 'Vacancy', 'User'],
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// recipient + isRead: "get my unread notifications" — the primary query
notificationSchema.index({ recipient: 1, isRead: 1 });
// recipient + createdAt: "get my recent notifications" (sorted)
notificationSchema.index({ recipient: 1, createdAt: -1 });
// TTL: auto-delete read notifications after 90 days
// (keeps the collection from growing unbounded)
notificationSchema.index(
  { readAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'ttl_read_notifications' }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
