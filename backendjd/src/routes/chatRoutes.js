import { Router } from 'express';
import { authMiddleware } from '../middleware/roleMiddleware.js';
import {
  sendMessage,
  sendMessageToAdmin,
  getMessages,
  getConversations,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
  deleteConversation,
  getUnreadCount,
  getPollingMessages,
} from '../controllers/chatController.js';

const router = Router();

/**
 * POST /api/chat/send
 * Send a new message (both buyer and seller)
 */
router.post('/send', authMiddleware, sendMessage);

/**
 * POST /api/chat/send-admin
 * Buyer sends property inquiry directly to admin
 */
router.post('/send-admin', authMiddleware, sendMessageToAdmin);

/**
 * GET /api/chat/messages/:recipientId
 * Get chat history with a specific user
 */
router.get('/messages/:recipientId', authMiddleware, getMessages);

/**
 * GET /api/chat/conversations
 * Get all conversation threads for a user
 */
router.get('/conversations', authMiddleware, getConversations);

/**
 * GET /api/chat/unread-count
 * Get total unread message count
 */
router.get('/unread-count', authMiddleware, getUnreadCount);

/**
 * PUT /api/chat/mark-read/:conversationId
 * Mark messages as read
 */
router.put('/mark-read/:conversationId', authMiddleware, markMessagesAsRead);

/**
 * PUT /api/chat/messages/:messageId
 * Edit a message (sender only)
 */
router.put('/messages/:messageId', authMiddleware, updateMessage);

/**
 * DELETE /api/chat/messages/:messageId
 * Soft delete a message (sender only)
 */
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

/**
 * DELETE /api/chat/conversations/:conversationId
 * Delete entire conversation for current user only
 */
router.delete('/conversations/:conversationId', authMiddleware, deleteConversation);

/**
 * GET /api/chat/polling/:conversationId
 * Get messages for polling (since a timestamp, optionally filtered by propertyId)
 * Query params: ?since=timestamp&propertyId=propertyId
 */
router.get('/polling/:conversationId', authMiddleware, getPollingMessages);

export default router;
