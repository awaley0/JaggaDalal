import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as chatApi from '../api/chatApi';
import PollingChatbox from '../components/Chat/PollingChatbox';
import axiosInstance from '../api/axios';

/**
 * Chat Page
 * Comprehensive chat module with conversations, confirmed bookings, and messaging
 * Available for: Admin, Sellers, Buyers
 */
export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' or 'bookings'
  const [conversations, setConversations] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [initChatLoading, setInitChatLoading] = useState(null);
  const [deletingConversationId, setDeletingConversationId] = useState(null);

  // Parse deep-link params (used from payment success page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recipientId = params.get('recipientId');
    const bookingId = params.get('bookingId');
    const propertyId = params.get('propertyId');
    const recipientName = params.get('recipientName');

    if (recipientId) {
      setSelectedChat({
        conversationId: recipientId,
        bookingId: bookingId || null,
        propertyId: propertyId || null,
        userName: recipientName || 'Seller',
      });
      setActiveTab('conversations');
    }
  }, [location.search]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load conversations and bookings
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
      loadConfirmedBookings();
    }
  }, [isAuthenticated, user]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversations();
      if (response.success) {
        setConversations(response.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfirmedBookings = async () => {
    try {
      // Fetch bookings based on user role
      let bookingsResponse;
      
      if (user?.role === 'admin') {
        // Admin can see all bookings from admin endpoint
        bookingsResponse = await axiosInstance.get('/admin/bookings?limit=100');
      } else if (user?.role === 'seller') {
        bookingsResponse = await axiosInstance.get('/bookings/seller/my-bookings');
      } else {
        bookingsResponse = await axiosInstance.get('/bookings/my-bookings');
      }

      if (bookingsResponse.data.success) {
        const bookingsData = bookingsResponse.data.bookings || bookingsResponse.data.data || [];
        // Filter for confirmed bookings without chat initiated
        const confirmed = bookingsData.filter(
          (b) => b.status === 'confirmed' && !b.chatInitiated
        );
        setConfirmedBookings(confirmed);
      }
    } catch (err) {
      // Silently fail - this is optional
      console.error('Failed to load bookings:', err);
    }
  };

  const handleInitiateChat = async (bookingId, otherUserId, userName, propertyName) => {
    try {
      setInitChatLoading(bookingId);
      setError('');
      setSuccess('');

      const response = await chatApi.sellerInitializeChat(
        bookingId,
        `Hi! Thank you for booking "${propertyName}". How can I help?`
      );

      if (response.success) {
        setSuccess('Chat initiated successfully!');
        setSelectedChat({
          conversationId: otherUserId,
          bookingId,
          userName,
          propertyName,
        });

        // Refresh both lists
        setTimeout(() => {
          loadConversations();
          loadConfirmedBookings();
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.error || 'Failed to initialize chat');
    } finally {
      setInitChatLoading(null);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedChat({
      conversationId: conversation.conversationId,
      userName: conversation.user.name,
      avatar: conversation.user.avatar,
    });
  };

  const handleDeleteConversation = async (conversationId, userName) => {
    const confirmed = window.confirm(`Delete chat with ${userName}? This removes it only from your account.`);
    if (!confirmed) return;

    try {
      setDeletingConversationId(String(conversationId));
      setError('');
      setSuccess('');

      const response = await chatApi.deleteConversation(conversationId);
      if (response.success) {
        setConversations((prev) =>
          prev.filter((conv) => String(conv.conversationId) !== String(conversationId))
        );

        if (String(selectedChat?.conversationId) === String(conversationId)) {
          setSelectedChat(null);
        }

        setSuccess('Conversation deleted successfully.');
      }
    } catch (err) {
      setError(err.error || 'Failed to delete conversation');
    } finally {
      setDeletingConversationId(null);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = confirmedBookings.filter(
    (booking) =>
      booking.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.seller?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">💬 Messages</h1>
            <p className="text-gray-600">
              {user?.name} • {user?.role === 'admin' ? '👨‍💼 Admin' : user?.role === 'seller' ? '🏪 Seller' : '👤 Buyer'}
            </p>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-lg p-2 shadow">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'conversations'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Chats ({filteredConversations.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Bookings ({filteredBookings.length})
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder={activeTab === 'conversations' ? 'Search chats...' : 'Search bookings...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Content */}
            <div className="bg-white rounded-lg shadow overflow-y-auto max-h-[600px]">
              {isLoading && activeTab === 'conversations' ? (
                <div className="p-6 text-center text-gray-500">Loading conversations...</div>
              ) : activeTab === 'conversations' ? (
                filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No conversations yet. Start chatting!
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.conversationId}
                        className={`p-4 hover:bg-blue-50 transition ${
                          selectedChat?.conversationId === conv.conversationId
                            ? 'bg-blue-100 border-l-4 border-blue-600'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {conv.user.avatar ? (
                            <img
                              src={conv.user.avatar}
                              alt={conv.user.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                              {conv.user.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleSelectConversation(conv)}
                              className="w-full text-left"
                            >
                              <p className="font-semibold text-gray-900 truncate">
                                {conv.user.name}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {conv.lastMessage || 'No messages'}
                              </p>
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(conv.conversationId, conv.user.name)}
                            disabled={deletingConversationId === String(conv.conversationId)}
                            className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            title="Delete chat"
                          >
                            {deletingConversationId === String(conv.conversationId) ? 'Deleting...' : 'Delete'}
                          </button>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Bookings Tab
                filteredBookings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No confirmed bookings waiting for chat
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredBookings.map((booking) => {
                      const currentUserId = user?.id || user?._id;
                      const otherUser =
                        currentUserId === booking.buyer?._id ? booking.seller : booking.buyer;
                      const propertyTitle = booking.property?.title || 'Property';

                      return (
                        <div key={booking._id} className="p-4 hover:bg-blue-50 transition">
                          <div className="mb-2">
                            <p className="font-semibold text-gray-900 text-sm">
                              {propertyTitle}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {user?.role === 'seller'
                                ? `Buyer: ${booking.buyer?.name || 'Unknown'}`
                                : `Seller: ${booking.seller?.name || 'Unknown'}`}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleInitiateChat(
                                booking._id,
                                otherUser?._id,
                                otherUser?.name,
                                propertyTitle
                              )
                            }
                            disabled={initChatLoading === booking._id}
                            className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition ${
                              initChatLoading === booking._id
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {initChatLoading === booking._id
                              ? '⏳ Starting...'
                              : '💬 Start Chat'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="lg:col-span-2">
            {selectedChat ? (
              <PollingChatbox
                recipientId={selectedChat.conversationId}
                bookingId={selectedChat.bookingId}
                propertyId={selectedChat.propertyId}
                recipientName={selectedChat.userName}
                recipientAvatar={selectedChat.avatar || null}
                isOpen={true}
              />
            ) : (
              <div className="bg-white rounded-lg shadow h-96 md:h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Select a Conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a chat or start one from the confirmed bookings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
