const messageService = require('../services/messageService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/messages/conversations
 * Returns all conversations (connections with last message + unread count)
 * for the authenticated user.
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await messageService.getConversations(req.user.id);
  res.status(200).json({
    status: 'success',
    data: { conversations },
  });
});

/**
 * GET /api/messages/:connectionId
 * Returns all messages for a connection.
 * Verifies the user is a member of the connection.
 */
const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getMessages(
    req.params.connectionId,
    req.user.id
  );
  res.status(200).json({
    status: 'success',
    data: { messages },
  });
});

/**
 * POST /api/messages/:connectionId
 * Sends a new message. text comes from req.body.
 * sender is always derived from req.user — never trusted from body.
 */
const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(
    req.params.connectionId,
    req.user.id,
    req.body.text
  );
  res.status(201).json({
    status: 'success',
    data: { message },
  });
});

/**
 * PATCH /api/messages/:connectionId/read
 * Marks all unread messages in the connection where receiver = currentUser as read.
 */
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const count = await messageService.markMessagesAsRead(
    req.params.connectionId,
    req.user.id
  );
  res.status(200).json({
    status: 'success',
    data: { markedRead: count },
  });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
};
