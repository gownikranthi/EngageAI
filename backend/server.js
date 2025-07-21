require('dotenv-safe').config({ allowEmptyValues: true, example: './env.example.safe' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const engagementRoutes = require('./routes/engagement');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');
const pollRoutes = require('./routes/polls');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const { swaggerUi, specs } = require('./swagger');

// Import Socket.IO handler
const SocketHandler = require('./socket/socketHandler');
const { generalLimiter, adminLimiter, eventLimiter, sensitiveLimiter } = require('./middleware/rateLimit');
const sanitizeMiddleware = require('./middleware/sanitize');
const { initializeVectorStore } = require('./services/ragService');
const chatController = require('./controllers/chatController');

// Initialize express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Socket.IO handler
new SocketHandler(io);

// Connect to database
connectDB().then(() => {
  // Initialize the RAG service after the database is connected
  initializeVectorStore();
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);

// Apply general rate limiter globally
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EngageAI Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventLimiter, eventRoutes); // Moderate limiter for events
app.use('/api/v1/engage', engagementRoutes);
app.use('/api/v1/scores', scoreRoutes);
app.use('/api/v1/admin', adminLimiter, adminRoutes); // More generous limiter for admin actions
app.use('/api/v1/polls', pollRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.post('/api/v1/rag-chat', chatController.handleRagChat); // Add the new route

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 EngageAI Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time connections`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 