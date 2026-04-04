import { io } from 'socket.io-client';

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

class ChatService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = {};
  }

  connect(userId) {
    if (this.socket?.connected) return;

    this.userId = userId || getStoredUserId();
    if (!this.userId) return;

    this.socket = io(getSocketBaseUrl(), {
      auth: {
        token: localStorage.getItem('token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      this.socket.emit('user-online', this.userId);
      this.emit('connected', { userId: this.userId });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Message events - auto listen
    this.socket.on('receive-message', (message) => {
      this.emit('message-received', message);
    });

    this.socket.on('message-sent', (data) => {
      this.emit('message-confirmed', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user-typing', data);
    });

    this.socket.on('user-stopped-typing', (data) => {
      this.emit('user-stopped-typing', data);
    });

    this.socket.on('user-status-changed', (data) => {
      this.emit('user-status-changed', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send a message
  sendMessage(receiverId, message, propertyId = null) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return false;
    }

    this.socket.emit('send-message', {
      senderId: this.userId,
      receiverId,
      message,
      propertyId,
    });

    return true;
  }

  // Typing indicator
  setTyping(receiverId) {
    if (!this.socket?.connected) return;
    this.socket.emit('user-typing', {
      senderId: this.userId,
      receiverId,
    });
  }

  // Stop typing
  stopTyping(receiverId) {
    if (!this.socket?.connected) return;
    this.socket.emit('user-stopped-typing', {
      senderId: this.userId,
      receiverId,
    });
  }

  // Mark as read
  markAsRead(receiverId) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark-as-read', receiverId);
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new ChatService();
