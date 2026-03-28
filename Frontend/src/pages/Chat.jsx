import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/ChatService';
import axiosInstance from '../api/axios';

export default function ChatPortal() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [usersTyping, setUsersTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize chat service
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    chatService.connect(user.id);

    // Listen for real-time events
    chatService.on('connected', () => {
      console.log('Chat service connected');
    });

    chatService.on('message-received', (message) => {
      if (selectedConversation && message.sender === selectedConversation) {
        setMessages((prev) => [...prev, message]);
      }
      // Update conversations list
      fetchConversations();
    });

    chatService.on('user-typing', (data) => {
      if (data.senderId === selectedConversation) {
        setUsersTyping((prev) => ({
          ...prev,
          [data.senderId]: true,
        }));
      }
    });

    chatService.on('user-stopped-typing', (data) => {
      setUsersTyping((prev) => ({
        ...prev,
        [data.senderId]: false,
      }));
    });

    chatService.on('user-online', (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
    });

    chatService.on('user-status-changed', (data) => {
      if (data.isOnline) {
        setOnlineUsers((prev) => new Set([...prev, data.userId]));
      } else {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    return () => {
      chatService.disconnect();
    };
  }, [user, selectedConversation, navigate]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (recipientId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/chat/messages/${recipientId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
        // Mark as read
        await axiosInstance.put(`/chat/mark-read/${recipientId}`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation.conversationId);
    fetchMessages(conversation.conversationId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      chatService.sendMessage(selectedConversation, newMessage);

      // Also save via HTTP for persistence
      await axiosInstance.post('/chat/send', {
        receiverId: selectedConversation,
        message: newMessage,
        messageType: 'text',
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    chatService.setTyping(selectedConversation);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chatService.stopTyping(selectedConversation);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Please log in to access chat</p>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-2xl font-bold text-white">💬 Messages</h1>
          <p className="text-sm text-blue-100 mt-1">Stay connected with property owners</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No conversations yet</p>
                <button
                  onClick={() => navigate('/rent')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Book a property to start chatting
                </button>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.conversationId;
              const isOnline = onlineUsers.has(conversation.conversationId);

              return (
                <div
                  key={conversation.conversationId}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`border-b border-gray-100 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.user.name}
                        </h3>
                        {isOnline && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.lastMessageTime).toLocaleDateString()}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="ml-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {conversations.find((c) => c.conversationId === selectedConversation)?.user.name}
                    </h2>
                    <p className="text-sm opacity-90">
                      {onlineUsers.has(selectedConversation) ? '🟢 Online' : '⚪ Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender === user.id
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === user.id ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {usersTyping[selectedConversation] && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-2xl mb-4">👈 Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
