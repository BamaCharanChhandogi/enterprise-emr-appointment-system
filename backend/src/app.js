const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { successResponse } = require('./utils/apiResponse');
const mongoose = require('mongoose');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-minutes', 'x-client-date', 'x-client-timezone']
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes', data: null, meta: {} }
});
app.use('/api/v1/auth', authLimiter);

// Health check endpoints (supports standard monitoring paths)
const healthHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return successResponse(res, 200, 'Enterprise EMR API is running smoothly', {
    status: isDbConnected ? 'UP' : 'DEGRADED',
    database: isDbConnected ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};

app.get(['/health', '/api/health', '/api/v1/health'], healthHandler);
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Enterprise EMR Appointment System API',
    health: '/api/health'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/slots', slotRoutes);
app.use('/api/v1/appointments', appointmentRoutes);

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    data: null,
    meta: {}
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
