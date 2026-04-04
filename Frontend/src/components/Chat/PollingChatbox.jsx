import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import * as chatApi from '../../api/chatApi';
import ChatService from '../../services/ChatService';

const getStoredUserId = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || parsed?._id || null;
  } catch {
    return null;
  }
};

/**
 * PollingChatbox Component
 * Uses polling instead of WebSocket for real-time chat
 * - Polls for new messages every 2-3 seconds
 * - Marks messages as read when received
 * - Supports property-specific chat context
 */
export default function PollingChatbox({
  recipientId,
  propertyId = null,
  bookingId = null,
  recipientName = 'Agent',
  isOpen = true,
  embedded = true,
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!isOpen);
  const [error, setError] = useState(null);
  const [lastPolledTime, setLastPolledTime] = useState(Date.now());
  const [isPolling, setIsPolling] = useState(true);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [messageActionInProgress, setMessageActionInProgress] = useState(false);
  const pollingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userId = getStoredUserId();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        setIsLoading(true);
        const response = await chatApi.getMessages(recipientId, 50, 0);
        if (response.success) {
          setMessages(response.messages || []);
          setLastPolledTime(Date.now());
          await chatApi.markMessagesAsRead(recipientId);
        }
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMessages();
  }, [recipientId]);

  // Setup polling interval
  useEffect(() => {
    if (!isPolling || isMinimized) return;

    const pollForMessages = async () => {
      try {
        const response = await chatApi.getPollingMessages(recipientId, lastPolledTime, propertyId);
        if (response.success && response.messages && response.messages.length > 0) {
          setMessages((prev) => {
            const merged = [...prev, ...response.messages];
            const deduped = [];
            const seen = new Set();
            for (const msg of merged) {
              const key = String(msg._id || msg.id || `${msg.sender}-${msg.createdAt}-${msg.message}`);
              if (!seen.has(key)) {
                seen.add(key);
                deduped.push(msg);
              }
            }
            return deduped;
          });
          setLastPolledTime(response.timestamp);
          await chatApi.markMessagesAsRead(recipientId);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll every 2.5 seconds
    pollingIntervalRef.current = setInterval(pollForMessages, 2500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, recipientId, propertyId, lastPolledTime, isMinimized]);

  // Socket presence + typing listeners for real-time UX
  useEffect(() => {
    if (!userId || !recipientId) return;

    ChatService.connect(userId);

    const onStatusChanged = ({ userId: changedUserId, isOnline }) => {
      if (String(changedUserId) === String(recipientId)) {
        setIsRecipientOnline(Boolean(isOnline));
      }
    };

    const onOnlineUsers = ({ userIds }) => {
      const online = (userIds || []).map((id) => String(id)).includes(String(recipientId));
      setIsRecipientOnline(online);
    };

    const onUserTyping = ({ senderId }) => {
      if (String(senderId) === String(recipientId)) {
        setIsRecipientTyping(true);
      }
    };

    const onUserStoppedTyping = ({ senderId }) => {
      if (String(senderId) === String(recipientId)) {
        setIsRecipientTyping(false);
      }
    };

    ChatService.on('user-status-changed', onStatusChanged);
    ChatService.on('online-users', onOnlineUsers);
    ChatService.on('user-typing', onUserTyping);
    ChatService.on('user-stopped-typing', onUserStoppedTyping);

    // Initialize immediate state if already known.
    setIsRecipientOnline(ChatService.isUserOnline(recipientId));

    return () => {
      ChatService.off('user-status-changed', onStatusChanged);
      ChatService.off('online-users', onOnlineUsers);
      ChatService.off('user-typing', onUserTyping);
      ChatService.off('user-stopped-typing', onUserStoppedTyping);
    };
  }, [userId, recipientId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Ensure typing indicator is cleared after send.
      ChatService.stopTyping(recipientId);
      if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current);
      setIsRecipientTyping(false);

      const response = await chatApi.sendMessage(recipientId, message, propertyId || null, 'text');

      if (response.success) {
        // Add sent message to display
        setMessages((prev) => [...prev, response.data]);
        setMessage('');
        setLastPolledTime(Date.now());
      }
    } catch (err) {
      setError(err.error || 'Failed to send message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (msg) => {
    if (msg.isDeleted) return;
    setEditingMessageId(String(msg._id || msg.id));
    setEditingText(msg.message || '');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;

    try {
      setMessageActionInProgress(true);
      const response = await chatApi.updateMessage(editingMessageId, editingText.trim());

      if (response.success && response.data) {
        setMessages((prev) =>
          prev.map((msg) => {
            const msgId = String(msg._id || msg.id);
            return msgId === editingMessageId ? response.data : msg;
          })
        );
        handleCancelEdit();
      }
    } catch (err) {
      setError(err.error || 'Failed to update message');
    } finally {
      setMessageActionInProgress(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;

    try {
      setMessageActionInProgress(true);
      const response = await chatApi.deleteMessage(msgId);
      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) => {
            const currentId = String(msg._id || msg.id);
            if (currentId !== String(msgId)) return msg;
            return {
              ...msg,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              message: 'This message was deleted',
              attachmentUrl: null,
            };
          })
        );
      }
    } catch (err) {
      setError(err.error || 'Failed to delete message');
    } finally {
      setMessageActionInProgress(false);
    }
  };

  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!value.trim()) {
      ChatService.stopTyping(recipientId);
      if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current);
      return;
    }

    ChatService.setTyping(recipientId);

    // Debounce stop-typing event to avoid noisy emits.
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ChatService.stopTyping(recipientId);
    }, 1200);
  };

  // Format message timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition z-40"
      >
        <p className="font-semibold">💬 {recipientName}</p>
      </div>
    );
  }

  const getSenderId = (msg) => msg?.sender?._id || msg?.sender?.id || msg?.sender;

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col ${
        embedded ? 'w-full h-[72vh] min-h-[520px]' : 'fixed bottom-4 right-4 w-96 z-50 max-h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-bold">{recipientName}</h3>
            <p className="text-xs opacity-80">
              {isRecipientTyping
                ? '✍️ typing...'
                : isRecipientOnline
                ? '🟢 Online'
                : '⚪ Offline'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!embedded && (
            <>
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <MinusIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 text-center">
              <p className="text-lg">👋 Start the conversation</p>
              <p className="text-sm">Send a message to begin</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderId = String(getSenderId(msg));
            const isSent = senderId === String(userId);

            return (
              <div key={msg._id || idx} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-md px-4 py-2 rounded-lg wrap-break-word ${
                    isSent
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {!isSent && (
                    <p className="text-xs font-semibold text-blue-600 mb-1">
                      {msg.sender?.name || 'User'}
                    </p>
                  )}
                  {editingMessageId === String(msg._id || msg.id) ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-blue-300 text-sm text-gray-900"
                        maxLength={1000}
                        disabled={messageActionInProgress}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700"
                          disabled={messageActionInProgress}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="text-xs px-2 py-1 rounded bg-blue-800 text-white"
                          disabled={messageActionInProgress || !editingText.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm ${msg.isDeleted ? 'italic opacity-80' : ''}`}>{msg.message}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      isSent ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.createdAt || msg.timestamp)}
                    {msg.isEdited && !msg.isDeleted ? ' • edited' : ''}
                  </p>
                  {isSent && (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex gap-2 text-[11px] text-blue-100">
                        {!msg.isDeleted && editingMessageId !== String(msg._id || msg.id) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className="hover:underline"
                              disabled={messageActionInProgress}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(String(msg._id || msg.id))}
                              className="hover:underline"
                              disabled={messageActionInProgress}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-100 text-right">
                        {msg.isRead ? 'Seen' : 'Delivered'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleMessageInputChange}
            placeholder="Type message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition font-semibold"
          >
            {isLoading ? '...' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
}
