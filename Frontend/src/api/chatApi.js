import axios from './axios';

/**
 * Send a message in chat
 */
export const sendMessage = async (receiverId, message, propertyId = null, messageType = 'text') => {
  try {
    const extraPayload =
      typeof messageType === 'object' && messageType !== null ? messageType : { messageType };

    const response = await axios.post('/chat/send', {
      receiverId,
      message,
      propertyId,
      ...extraPayload,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send message' };
  }
};

/**
 * Send a message directly to admin (buyer flow)
 */
export const sendMessageToAdmin = async (propertyId = null, message = '') => {
  try {
    const response = await axios.post('/chat/send-admin', {
      propertyId,
      message,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send message to admin' };
  }
};

/**
 * Get chat history with a specific user
 */
export const getMessages = async (recipientId, limit = 50, skip = 0) => {
  try {
    const response = await axios.get(`/chat/messages/${recipientId}`, {
      params: { limit, skip },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch messages' };
  }
};

/**
 * Get polling messages since a timestamp (for real-time polling)
 * If propertyId is provided, only get messages for that property
 */
export const getPollingMessages = async (conversationId, since = null, propertyId = null) => {
  try {
    const params = {};
    if (since) params.since = since;
    if (propertyId) params.propertyId = propertyId;

    const response = await axios.get(`/chat/polling/${conversationId}`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch messages' };
  }
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async () => {
  try {
    const response = await axios.get('/chat/conversations');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch conversations' };
  }
};

/**
 * Delete a full conversation for current user
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await axios.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete conversation' };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    const response = await axios.put(`/chat/mark-read/${conversationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to mark messages as read' };
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(`/chat/messages/${messageId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete message' };
  }
};

/**
 * Update a message
 */
export const updateMessage = async (messageId, message) => {
  try {
    const response = await axios.put(`/chat/messages/${messageId}`, { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update message' };
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async () => {
  try {
    const response = await axios.get('/chat/unread-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch unread count' };
  }
};

/**
 * Seller initializes chat with buyer for a booking
 */
export const sellerInitializeChat = async (bookingId, message = null) => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/init-chat`, { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to initialize chat' };
  }
};

/**
 * Rate a booking (buyer only, after confirmed)
 */
export const rateBooking = async (bookingId, score, comment = '') => {
  try {
    const response = await axios.post(`/bookings/${bookingId}/rate`, {
      score,
      comment,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to submit rating' };
  }
};
