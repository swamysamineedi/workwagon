const express = require('express');
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

const router = express.Router();

// All message routes require authentication
router.use(protect);

// GET /api/messages/conversations
// Must be BEFORE /:connectionId to avoid route conflict
router.get('/conversations', messageController.getConversations);

// GET  /api/messages/:connectionId        — fetch all messages
// POST /api/messages/:connectionId        — send a message
router
  .route('/:connectionId')
  .get(messageController.getMessages)
  .post(messageController.sendMessage);

// PATCH /api/messages/:connectionId/read  — mark messages as read
router.patch('/:connectionId/read', messageController.markMessagesAsRead);

module.exports = router;
