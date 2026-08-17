const mongoose = require('mongoose');

/**
 * Connection
 *
 * Represents a confirmed mutual relationship between ONE Worker and ONE Shop.
 * Created ONLY when both sides have expressed mutual interest (both sent requests).
 *
 * This is NOT created by either party directly — it is created automatically
 * by the RequestService when mutual-match detection succeeds.
 *
 * IMPORTANT: A Connection also contributes to incrementing Vacancy.filledSlots.
 * That update is handled transactionally in the service layer.
 *
 * STATUS:
 *   active   — both parties are engaged
 *   ended    — one or both parties ended the arrangement
 *
 * Relationships:
 *  - Connection N ─── 1 WorkerProfile
 *  - Connection N ─── 1 ShopProfile
 *  - Connection N ─── 0|1 Vacancy
 *  - Connection 1 ─── 2 Request (the two matched requests that created it)
 */
const connectionSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: [true, 'Worker is required'],
    },
    workerUser: {
      // Denormalized User reference — faster auth checks without WorkerProfile populate
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopProfile',
      required: [true, 'Shop is required'],
    },
    shopUser: {
      // Denormalized User reference
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vacancy: {
      // The vacancy this connection fills a slot in (if applicable)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
    },
    // The two requests that created this connection
    workerRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
    shopRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'ended'],
        message: 'Connection status must be active or ended',
      },
      default: 'active',
    },
    endedAt: {
      type: Date,
    },
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// worker: "find all connections for this worker"
connectionSchema.index({ worker: 1 });
// shop: "find all connections for this shop"
connectionSchema.index({ shop: 1 });
// workerUser + shopUser compound: prevent duplicate connections
connectionSchema.index(
  { workerUser: 1, shopUser: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'active' },
    name: 'unique_active_connection',
  }
);
// status: find all active/ended connections
connectionSchema.index({ status: 1 });
// vacancy: find all connections filling a specific vacancy
connectionSchema.index({ vacancy: 1 });

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;
