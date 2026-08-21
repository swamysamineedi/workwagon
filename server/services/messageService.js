const Message = require('../models/Message');
const Connection = require('../models/Connection');
const WorkerProfile = require('../models/WorkerProfile');
const ShopProfile = require('../models/ShopProfile');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validates that a connection exists, is active, and the userId is a member.
 * Returns { connection, otherUserId } on success.
 * Throws AppError on any failure.
 *
 * @param {string} connectionId
 * @param {string} userId - authenticated user's ID
 */
const verifyConnectionMembership = async (connectionId, userId) => {
  if (!connectionId || !connectionId.match(/^[a-f\d]{24}$/i)) {
    throw new AppError('Invalid connection ID.', 400);
  }

  const connection = await Connection.findById(connectionId);

  if (!connection) {
    throw new AppError('Connection not found.', 404);
  }
  if (connection.status !== 'active') {
    throw new AppError('This connection is not active. Chat is only available for active connections.', 403);
  }

  const workerUserId = String(connection.workerUser);
  const shopUserId   = String(connection.shopUser);
  const uId          = String(userId);

  if (uId !== workerUserId && uId !== shopUserId) {
    throw new AppError('You are not authorized to access this conversation.', 403);
  }

  const otherUserId = uId === workerUserId ? shopUserId : workerUserId;

  return { connection, otherUserId };
};

/**
 * getConversations
 *
 * Returns all active connections for a user, each enriched with:
 *  - the other party's profile (name, businessName, avatarUrl, etc.)
 *  - the last message in that conversation
 *  - unread message count for the requesting user
 */
const getConversations = async (userId) => {
  const uId = String(userId);

  // Find all active connections where this user is a participant
  const connections = await Connection.find({
    $or: [{ workerUser: userId }, { shopUser: userId }],
    status: 'active',
  })
    .populate('worker', 'firstName lastName avatarUrl')
    .populate('shop', 'businessName logoUrl')
    .populate('vacancy', 'title')
    .sort({ updatedAt: -1 })
    .lean();

  if (connections.length === 0) return [];

  // For each connection, get last message + unread count in parallel
  const enriched = await Promise.all(
    connections.map(async (conn) => {
      const connId = conn._id;

      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ connection: connId })
          .sort({ createdAt: -1 })
          .select('text sender createdAt read')
          .lean(),
        Message.countDocuments({
          connection: connId,
          receiver: userId,
          read: false,
        }),
      ]);

      // Determine the other user's display info
      const isWorker = uId === String(conn.workerUser);
      const otherName = isWorker
        ? conn.shop?.businessName || 'Business'
        : conn.worker
          ? `${conn.worker.firstName || ''} ${conn.worker.lastName || ''}`.trim() || 'Worker'
          : 'Worker';
      const otherAvatar = isWorker ? conn.shop?.logoUrl : conn.worker?.avatarUrl;

      return {
        connectionId: connId,
        otherUserId:  isWorker ? conn.shopUser : conn.workerUser,
        otherName,
        otherAvatar,
        vacancy:      conn.vacancy ? { title: conn.vacancy.title } : null,
        lastMessage:  lastMessage || null,
        unreadCount,
        connectedAt:  conn.createdAt,
      };
    })
  );

  return enriched;
};

/**
 * getMessages
 *
 * Returns all messages for a connection, oldest first.
 * Verifies the requesting user is a member of the connection.
 */
const getMessages = async (connectionId, userId) => {
  await verifyConnectionMembership(connectionId, userId);

  const messages = await Message.find({ connection: connectionId })
    .populate('sender', 'email role')
    .populate('receiver', 'email role')
    .sort({ createdAt: 1 })
    .lean();

  return messages;
};

/**
 * sendMessage
 *
 * Creates a new message. Derives sender/receiver from the authenticated
 * user and the Connection document — never from client input.
 *
 * Returns the saved message populated with sender/receiver.
 */
const sendMessage = async (connectionId, userId, text) => {
  // Validate text
  if (!text || typeof text !== 'string') {
    throw new AppError('Message text is required.', 400);
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new AppError('Message cannot be empty.', 400);
  }
  if (trimmed.length > 2000) {
    throw new AppError('Message cannot exceed 2000 characters.', 400);
  }

  const { otherUserId } = await verifyConnectionMembership(connectionId, userId);

  const message = await Message.create({
    connection: connectionId,
    sender:     userId,
    receiver:   otherUserId,
    text:       trimmed,
    read:       false,
  });

  // Return populated version
  const populated = await Message.findById(message._id)
    .populate('sender', 'email role')
    .populate('receiver', 'email role')
    .lean();

  return populated;
};

/**
 * markMessagesAsRead
 *
 * Marks all unread messages in a connection where receiver = userId as read.
 * Returns the number of messages updated.
 */
const markMessagesAsRead = async (connectionId, userId) => {
  await verifyConnectionMembership(connectionId, userId);

  const result = await Message.updateMany(
    {
      connection: connectionId,
      receiver:   userId,
      read:       false,
    },
    { $set: { read: true } }
  );

  return result.modifiedCount;
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  verifyConnectionMembership,
};
