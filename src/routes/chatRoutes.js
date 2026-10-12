/**
 * Chat Routes
 * Endpoints for messaging threads and messages
 */

const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getMyConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/messages', sendMessage);
router.patch('/conversations/:id/read', markAsRead);

module.exports = router;
