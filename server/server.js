const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./config/logger');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const setupRoutes = require('./routes/setupRoutes');
const chatRoutes = require('./routes/chatRoutes');
const logsRoutes = require('./routes/logsRoutes');
const chatHandler = require('./socket/chatHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://intellicare-support.vercel.app'
];

// Add CLIENT_URL from environment if it exists and not already in list
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Initialize chat handler
chatHandler(io);

// Make io accessible to routes
app.set('io', io);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Test database connection and sync tables
db.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
    // Auto-sync database tables in production (create tables if they don't exist)
    if (process.env.NODE_ENV === 'production') {
      // Temporarily enable alter to add missing columns (attachments)
      return db.sync({ alter: true, force: false });
    }
  })
  .then(() => {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Database tables synced');
    }
  })
  .catch(err => logger.error('Database error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'IntelliCare Support API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info('Socket.IO enabled');
});

module.exports = app;
