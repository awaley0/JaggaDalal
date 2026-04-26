import { useState, useEffect, useMemo, useRef } from 'react';
import {
  XMarkIcon,
  MinusIcon,
  PhotoIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
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
  recipientAvatar = null,
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const pollingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const stopTypingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachmentMenuRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!attachmentMenuRef.current) return;
      if (!attachmentMenuRef.current.contains(event.target)) {
        setIsAttachmentMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const hasText = Boolean(message.trim());
    const hasImage = Boolean(selectedImage?.dataUrl);
    const hasLocation = Boolean(pendingLocation);

    if (!hasText && !hasImage && !hasLocation) return;

    try {
      setIsLoading(true);
      setError(null);

      // Ensure typing indicator is cleared after send.
      ChatService.stopTyping(recipientId);
      if (stopTypingTimeoutRef.current) clearTimeout(stopTypingTimeoutRef.current);
      setIsRecipientTyping(false);

      let response;
      if (hasImage) {
        response = await chatApi.sendMessage(recipientId, message.trim() || 'Shared an image', propertyId || null, {
          messageType: 'image',
          imageData: selectedImage.dataUrl,
          attachmentName: selectedImage.name,
        });
      } else if (hasLocation) {
        response = await chatApi.sendMessage(recipientId, message.trim() || 'Shared a location', propertyId || null, {
          messageType: 'location',
          location: pendingLocation,
        });
      } else {
        response = await chatApi.sendMessage(recipientId, message.trim(), propertyId || null, {
          messageType: 'text',
        });
      }

      if (response.success) {
        // Add sent message to display
        setMessages((prev) => [...prev, response.data]);
        setMessage('');
        setSelectedImage(null);
        setPendingLocation(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
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
              location: null,
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        name: file.name,
        dataUrl: reader.result,
      });
      setPendingLocation(null);
      setIsAttachmentMenuOpen(false);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read selected image');
    reader.readAsDataURL(file);
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser');
      return;
    }

    setIsSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        setPendingLocation({
          latitude,
          longitude,
          label: 'Current location',
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
        setSelectedImage(null);
        setIsAttachmentMenuOpen(false);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
        setIsSharingLocation(false);
        setError(null);
      },
      () => {
        setError('Unable to fetch your location. Please allow location permission.');
        setIsSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
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

  const formatDayLabel = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredMessages = useMemo(() => {
    const search = conversationSearch.trim().toLowerCase();
    if (!search) return messages;

    return messages.filter((msg) => {
      const text = String(msg.message || '').toLowerCase();
      const attachment = String(msg.attachmentName || '').toLowerCase();
      const sender = String(msg.sender?.name || '').toLowerCase();
      return text.includes(search) || attachment.includes(search) || sender.includes(search);
    });
  }, [messages, conversationSearch]);

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 bg-linear-to-r from-slate-900 to-indigo-800 text-white px-4 py-3 rounded-xl shadow-xl cursor-pointer hover:shadow-2xl transition z-40 border border-white/20"
      >
        <p className="font-semibold">💬 {recipientName}</p>
      </div>
    );
  }

  const getSenderId = (msg) => msg?.sender?._id || msg?.sender?.id || msg?.sender;

  return (
    <div
      className={`bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col ${
        embedded ? 'w-full h-[76vh] min-h-[560px]' : 'fixed bottom-4 right-4 w-96 z-50 max-h-[700px]'
      }`}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-slate-950 via-indigo-900 to-blue-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {recipientAvatar ? (
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/40">
                <span className="text-sm font-bold">{String(recipientName || 'A').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isRecipientOnline ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">{recipientName}</h3>
            <p className="text-xs text-blue-100/90 leading-tight">
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

      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            placeholder="Search in conversation"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-linear-to-b from-slate-50 via-slate-100 to-slate-100">
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500 text-center">
              <p className="text-lg">👋 Start the conversation</p>
              <p className="text-sm">Send a message to begin</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const senderId = String(getSenderId(msg));
            const isSent = senderId === String(userId);
            const previousMessage = idx > 0 ? filteredMessages[idx - 1] : null;
            const currentDay = new Date(msg.createdAt || msg.timestamp).toDateString();
            const previousDay = previousMessage
              ? new Date(previousMessage.createdAt || previousMessage.timestamp).toDateString()
              : null;
            const showDateDivider = currentDay !== previousDay;

            return (
              <div key={msg._id || idx}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-slate-200 text-slate-600">
                      {formatDayLabel(msg.createdAt || msg.timestamp)}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
                  {!isSent && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-semibold shrink-0 mb-1">
                      {String(msg.sender?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div
                    className={`group max-w-md px-4 py-2.5 rounded-2xl shadow-sm border wrap-break-word backdrop-blur-sm ${
                      isSent
                        ? 'bg-linear-to-br from-blue-600 to-indigo-600 text-white border-blue-500/70 rounded-br-sm'
                        : 'bg-white/95 text-slate-800 border-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {!isSent && <p className="text-xs font-semibold text-indigo-700 mb-1">{msg.sender?.name || 'User'}</p>}

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
                      <div className="space-y-2">
                        {msg.messageType === 'image' && msg.attachmentUrl && !msg.isDeleted && (
                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'Shared image'}
                              className="max-h-64 w-full object-cover rounded-xl border border-white/30"
                            />
                            <p className={`mt-1 text-[11px] ${isSent ? 'text-blue-100' : 'text-slate-500'}`}>
                              {msg.attachmentName || 'Image'}
                            </p>
                          </a>
                        )}
                        {msg.messageType === 'location' && msg.location && !msg.isDeleted && (
                          <a
                            href={`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${
                              isSent ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            📍 View location
                          </a>
                        )}
                        {Boolean(msg.message) && (
                          <p className={`text-sm leading-relaxed ${msg.isDeleted ? 'italic opacity-80' : ''}`}>{msg.message}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className={`text-[11px] ${isSent ? 'text-blue-100' : 'text-slate-500'}`}>
                        {formatTime(msg.createdAt || msg.timestamp)}
                        {msg.isEdited && !msg.isDeleted ? ' • edited' : ''}
                      </p>

                      {isSent && (
                        <p className="text-[11px] text-blue-100 text-right">{msg.isRead ? 'Seen' : 'Delivered'}</p>
                      )}
                    </div>

                    {isSent && (
                      <div className="mt-1 flex justify-end gap-2 text-[11px] text-blue-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {!msg.isDeleted && msg.messageType === 'text' && editingMessageId !== String(msg._id || msg.id) && (
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
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isRecipientTyping && !isLoading && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-semibold">
              {String(recipientName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
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
      <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 bg-white">
        {selectedImage && (
          <div className="mb-3 p-3 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={selectedImage.dataUrl} alt="Selected" className="w-10 h-10 rounded object-cover" />
              <p className="text-sm text-blue-800 truncate">Image selected: {selectedImage.name}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                if (imageInputRef.current) imageInputRef.current.value = '';
              }}
              className="text-xs px-2 py-1 rounded bg-white border border-blue-200 text-blue-700"
            >
              Remove
            </button>
          </div>
        )}

        {pendingLocation && (
          <div className="mb-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-800 truncate">
              Location selected: {pendingLocation.address}
            </p>
            <button
              type="button"
              onClick={() => setPendingLocation(null)}
              className="text-xs px-2 py-1 rounded bg-white border border-emerald-200 text-emerald-700"
            >
              Remove
            </button>
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        <div className="flex items-center gap-2">
          <div className="relative" ref={attachmentMenuRef}>
            <button
              type="button"
              onClick={() => setIsAttachmentMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center text-lg font-semibold shadow-sm"
              title="Add attachment"
            >
              +
            </button>

            {isAttachmentMenuOpen && (
              <div className="absolute bottom-11 left-0 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-20">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                >
                  <PhotoIcon className="w-4 h-4 text-blue-600" />
                  <span>Share Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isSharingLocation}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-60 flex items-center gap-2"
                >
                  <MapPinIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isSharingLocation ? 'Locating...' : 'Share Location'}</span>
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={message}
            onChange={handleMessageInputChange}
            placeholder="Write a message..."
            disabled={isLoading}
            maxLength={1000}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || (!message.trim() && !selectedImage && !pendingLocation)}
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-3 py-2.5 rounded-xl transition font-semibold shadow-sm flex items-center justify-center"
            title="Send message"
          >
            {isLoading ? '...' : <PaperAirplaneIcon className="w-5 h-5" />}
          </button>
        </div>
        <div className="mt-1 text-right text-[11px] text-slate-500">{message.length}/1000</div>
      </form>
    </div>
  );
}
