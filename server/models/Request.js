const mongoose = require('mongoose');

/**
 * Request
 *
 * Models a directional interest expression between a Worker and a Shop.
 * Either side can initiate. A CONNECTION is only created when BOTH sides
 * have a pending Request toward each other — the mutual-match rule.
 *
 * DIRECTIONS:
 *   'worker_to_shop' — Worker expresses interest in a Shop's vacancy
 *   'shop_to_worker' — Shop proactively reaches out to a Worker
 *
 * STATUS MACHINE:
 *   pending  → accepted   (other side responded positively — triggers mutual check)
 *           → rejected    (other side declined)
 *           → cancelled   (initiator withdrew before response)
 *
 * MUTUAL MATCH DETECTION (handled in RequestService, NOT in this model):
 *   When a new 'pending' Request (A→B) is created:
 *     Check if Request (B→A) already exists with status 'pending'
 *     If yes → create Connection, mark both Requests as 'accepted'
 *
 * CONSTRAINTS (enforced via unique index + service layer):
 *   - No duplicate requests (same fromUser + toUser + vacancy combination)
 *   - No self-requests
 *   - Worker can only request a Shop (not another Worker)
 *   - Shop can only request a Worker (not another Shop)
 *
 * Relationships:
 *  - Request N ─── 1 User (fromUser)
 *  - Request N ─── 1 User (toUser)
 *  - Request N ─── 0|1 Vacancy (optional — shop_to_worker may not reference a vacancy)
 *  - Request 0|1 ─── 1 Connection (after mutual match)
 */
const requestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'fromUser is required'],
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'toUser is required'],
    },
    direction: {
      type: String,
      enum: {
        values: ['worker_to_shop', 'shop_to_worker'],
        message: 'Direction must be worker_to_shop or shop_to_worker',
      },
      required: [true, 'Direction is required'],
    },
    vacancy: {
      // Optional — worker requests are typically tied to a vacancy.
      // Shop-initiated requests may or may not reference a specific vacancy.
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled'],
        message: 'Invalid request status',
      },
      default: 'pending',
    },
    message: {
      // Optional personal note from the initiator
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    respondedAt: {
      // When the recipient accepted/rejected
      type: Date,
    },
    cancelledAt: {
      // When the initiator withdrew
      type: Date,
    },
    // Set when this request contributed to a mutual Connection
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// fromUser: "find all requests I sent"
requestSchema.index({ fromUser: 1 });
// toUser: "find all requests I received"
requestSchema.index({ toUser: 1 });
// status: filter by state (pending inbox, rejected history, etc.)
requestSchema.index({ status: 1 });
// Compound for mutual-match detection:
// "Does a pending request exist from toUser to fromUser?"
requestSchema.index({ fromUser: 1, toUser: 1, status: 1 });
// Compound uniqueness — prevent duplicate requests for same vacancy
// Note: unique is partial because shop_to_worker may have no vacancy
requestSchema.index(
  { fromUser: 1, toUser: 1, vacancy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'accepted'] },
      vacancy: { $exists: true },
    },
    name: 'unique_active_vacancy_request',
  }
);
// vacancy: find all requests for a specific vacancy
requestSchema.index({ vacancy: 1 });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
