const mongoose = require('mongoose');

/**
 * Message
 *
 * Stores a single chat message between a Worker and a Business.
 * Every message MUST belong to an existing, active Connection.
 *
 * SECURITY:
 *  - sender and receiver are derived server-side from the authenticated user
 *    and the Connection document. They are NEVER trusted from the client.
 *  - A message can only be created if the Connection status is 'active' and
 *    the sending user is either workerUser or shopUser of that Connection.
 *
 * Relationships:
 *  - Message N ─── 1 Connection
 *  - Message N ─── 1 User (sender)
 *  - Message N ─── 1 User (receiver)
 */
const messageSchema = new mongoose.Schema(
  {
    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Connection is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary retrieval: all messages for a connection ordered by time
messageSchema.index({ connection: 1, createdAt: 1 });

// Unread count: quickly find unread messages for a receiver in a connection
messageSchema.index({ connection: 1, receiver: 1, read: 1 });

// For conversations list: find latest message per connection for a sender/receiver
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
