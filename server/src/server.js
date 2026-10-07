/**
 * Relief Shield Server Entrypoint
 * 
 * WHY NODE.JS & EXPRESS:
 * Node.js provides a high-throughput, non-blocking asynchronous event loop that excels
 * at handling concurrent real-time emergency events, WebSockets, and REST endpoints.
 * Express provides lightweight, robust routing and middleware orchestration.
 * 
 * WHY SOCKET.IO:
 * In natural disasters and high-stress rescue operations, every second counts.
 * Socket.IO maintains an active persistent full-duplex WebSocket connection between clients
 * and the backend. When a new emergency request is posted, verified, or claimed, an event is instantly
 * broadcast to all online responders and victims with sub-second latency.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const seedData = require('./utils/seed');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRoutes = require('./routes/donationRoutes');

const app = express();
const server = http.createServer(app);

// Dynamic CORS origin handler for local dev and production Vercel apps
const checkOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  const clientUrl = process.env.CLIENT_URL;

  if (
    origin === clientUrl ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:5001' ||
    origin.endsWith('.vercel.app') ||
    process.env.NODE_ENV !== 'production'
  ) {
    return callback(null, true);
  }
  return callback(null, true); // Permissive in demo mode so cross-origin preview links never break
};

// Configure Socket.IO with CORS support for Vite frontend
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Store io instance in Express app so controllers can emit real-time events
app.set('io', io);

// Express Middleware
app.use(
  cors({
    origin: checkOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Real-Time Socket.IO connection logging
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationRoutes);

// Server Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Relief Shield API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;

// Connect to Database and start HTTP/Socket server
connectDB().then((conn) => {
  if (conn) {
    // Check and seed sample data on first launch
    seedData().catch((seedErr) => {
      console.warn('[Seeder Warning] Auto-seed failed:', seedErr.message);
    });
  }

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🛡️  Relief Shield Backend Running on Port ${PORT}`);
    console.log(`  🌐  REST API:   http://localhost:${PORT}/api`);
    console.log(`  ⚡  Socket.IO:  Ready for real-time events`);
    console.log(`====================================================`);
  });
});
