import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./src/config/db.js";
import { validateEnvironmentVariables } from "./src/config/validateEnv.js";
import passportConfig from "./src/config/passport.js";
import authRoutes from "./src/routes/authRoutes.js";
import propertyRoutes from "./src/routes/propertyRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import favouriteRoutes from "./src/routes/favouriteRoutes.js";
import searchRoutes from "./src/routes/searchRoutes.js";
import Chat from "./src/models/Chat.js";
import User from "./src/models/User.js";

dotenv.config();

// Validate environment variables at startup
validateEnvironmentVariables();

const app = express();
const httpServer = http.createServer(app);

// ============ SOCKET.IO CONFIGURATION ============
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: false,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Track online users
const onlineUsers = new Map(); // userId -> socketId

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production");
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return next(new Error(`Authentication error: ${error.message}`));
  }
});

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Send current online users snapshot so clients can render immediate presence state.
  socket.emit("online-users", Array.from(onlineUsers.keys()));

  // User comes online
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit("user-status-changed", { userId, isOnline: true });
    console.log(`👤 User online: ${userId}`);
  });

  // Send message via WebSocket
  socket.on("send-message", async (data) => {
    try {
      const { senderId, receiverId, message, propertyId } = data;

      // Verify sender
      if (socket.userId !== senderId) {
        return socket.emit("error", "Unauthorized sender");
      }

      // Save message to database
      const newMessage = new Chat({
        sender: senderId,
        receiver: receiverId,
        propertyId,
        message,
        messageType: "text",
      });

      const savedMessage = await newMessage.save();
      await savedMessage.populate("sender", "name email profileImage");
      await savedMessage.populate("receiver", "name email profileImage");

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", {
          id: savedMessage._id,
          sender: savedMessage.sender,
          receiver: savedMessage.receiver,
          message: savedMessage.message,
          propertyId: savedMessage.propertyId,
          timestamp: savedMessage.createdAt,
          messageType: "text",
        });
      }

      // Confirm to sender
      socket.emit("message-sent", {
        id: savedMessage._id,
        status: "delivered",
        timestamp: savedMessage.createdAt,
      });

      console.log(`💬 Message from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error("Send message error:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // Typing indicator
  socket.on("user-typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", {
        senderId,
        isTyping: true,
      });
    }
  });

  // Stop typing
  socket.on("user-stopped-typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-stopped-typing", {
        senderId,
        isTyping: false,
      });
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId) {
      onlineUsers.delete(userId);
      io.emit("user-status-changed", { userId, isOnline: false });
      console.log(`❌ User offline: ${userId}`);
    }
  });

  socket.on("error", (error) => {
    console.error(`Socket error: ${error}`);
  });
});

// ============ MIDDLEWARE ============

// CORS Configuration
const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Session Middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Body Parser Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logging
app.use((req, res, next) => {
  console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============ DATABASE ============
connectDB();

// ============ ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/favourites", favouriteRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "✅ API is running...",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    websocket: "enabled"
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.url,
    method: req.method 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { details: err.stack })
  });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 Server Running Successfully!      ║
║  🌍 http://localhost:${PORT}           ║
║  📡 API: http://localhost:${PORT}/api  ║
║  🔧 Environment: ${process.env.NODE_ENV || "development"}         ║
╚═══════════════════════════════════════╝
  `);
});
