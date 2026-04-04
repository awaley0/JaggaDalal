import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';

const getSocketBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, '');
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

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

export default function Chatbox({ recipientId, propertyId = null, recipientName = 'Agent', isOpen = true }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!isOpen);
  const [isOnline, setIsOnline] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userId = getStoredUserId();

  useEffect(() => {
    // Initialize Socket.IO
    socketRef.current = io(getSocketBaseUrl(), {
      auth: { token: localStorage.getItem('token') },
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('user-online', userId);
      setIsOnline(true);
    });

    socketRef.current.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current.on('user-typing', () => setIsTyping(true));
    socketRef.current.on('user-stopped-typing', () => setIsTyping(false));
    socketRef.current.on('disconnect', () => setIsOnline(false));

    return () => socketRef.current?.disconnect();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socketRef.current.emit('send-message', {
        senderId: userId,
        receiverId: recipientId,
        message,
        propertyId,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: userId,
          message,
          timestamp: new Date(),
        },
      ]);
      setMessage('');
    }
  };

  const handleTyping = () => {
    socketRef.current.emit('user-typing', { senderId: userId, receiverId: recipientId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('user-stopped-typing', { senderId: userId, receiverId: recipientId });
    }, 1000);
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

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50 max-h-[600px]">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold">{recipientName}</h3>
            <p className="text-xs opacity-80">{isOnline ? '🟢 Online' : '⚪ Offline'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-blue-500 rounded-lg transition"
          >
            <MinusIcon className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-blue-500 rounded-lg transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-center">
            <div>
              <p className="text-4xl mb-2">💬</p>
              <p className="font-semibold">Start the conversation!</p>
              <p className="text-sm">Message {recipientName} now</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.sender === userId
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="wrap-break-word">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender === userId ? 'text-blue-100' : 'text-gray-600'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-300 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-white flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onInput={handleTyping}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition font-bold text-white"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
