require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');

const connectDB        = require('./config/db');
const apiRoutes        = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { AppError }     = require('./middleware/errorHandler');
const User             = require('./models/User');
const messageService   = require('./services/messageService');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── HTTP Server (required for Socket.IO) ────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Allow the Vite dev proxy to upgrade WebSocket connections
  transports: ['websocket', 'polling'],
});

/**
 * Socket.IO Authentication Middleware
 *
 * Verifies the JWT token sent in the handshake auth object.
 * Attaches the authenticated user to socket.data.user.
 * Rejects the connection if the token is missing, invalid, or the user
 * does not exist / is deactivated.
 */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(new Error('Invalid or expired token.'));
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('User not found.'));
    }
    if (!user.isActive) {
      return next(new Error('Account deactivated.'));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed.'));
  }
});

/**
 * Socket.IO Connection Handler
 */
io.on('connection', (socket) => {
  const userId = String(socket.data.user._id);
  console.log(`[Socket.IO] User connected: ${userId} (socket: ${socket.id})`);

  // ── Join a conversation room ────────────────────────────────────────────────
  // Client emits 'join-conversation' with { connectionId }
  // We verify the user belongs to that connection before admitting them.
  socket.on('join-conversation', async ({ connectionId }) => {
    try {
      await messageService.verifyConnectionMembership(connectionId, userId);
      const room = `connection:${connectionId}`;
      socket.join(room);
      console.log(`[Socket.IO] User ${userId} joined room ${room}`);
    } catch (err) {
      socket.emit('error', { message: err.message || 'Cannot join conversation.' });
    }
  });

  // ── Leave a conversation room ───────────────────────────────────────────────
  socket.on('leave-conversation', ({ connectionId }) => {
    const room = `connection:${connectionId}`;
    socket.leave(room);
    console.log(`[Socket.IO] User ${userId} left room ${room}`);
  });

  // ── Send a message ──────────────────────────────────────────────────────────
  // Client emits 'send-message' with { connectionId, text }
  // Backend:
  //   1. Verifies connection membership (server-side, never trusts client userId)
  //   2. Saves the message to MongoDB
  //   3. Emits 'new-message' to all sockets in the room (including sender)
  socket.on('send-message', async ({ connectionId, text }) => {
    try {
      const message = await messageService.sendMessage(connectionId, userId, text);
      const room = `connection:${connectionId}`;
      // Emit to the entire room so both sender and receiver get the update
      io.to(room).emit('new-message', { message });
    } catch (err) {
      socket.emit('message-error', { message: err.message || 'Failed to send message.' });
    }
  });

  // ── Mark messages as read ───────────────────────────────────────────────────
  socket.on('mark-read', async ({ connectionId }) => {
    try {
      const count = await messageService.markMessagesAsRead(connectionId, userId);
      if (count > 0) {
        const room = `connection:${connectionId}`;
        // Notify the room so the sender can update unread indicators
        io.to(room).emit('messages-read', { connectionId, readBy: userId });
      }
    } catch {
      // Non-critical — silently ignore
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] User ${userId} disconnected: ${reason}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅  Work Wagon backend running on http://localhost:${PORT}`);
  console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health API   : http://localhost:${PORT}/api/health`);
  console.log(`   Socket.IO    : enabled`);
});
