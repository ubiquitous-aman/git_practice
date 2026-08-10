/**
 * src/app.js
 *
 * Express application factory.
 */

'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');

const requestLogger = require('./middleware/requestLogger');
const errorHandler  = require('./middleware/errorHandler');

// Route modules
const healthRoutes      = require('./routes/health');
const authRoutes        = require('./routes/auth');
const studentRoutes     = require('./routes/student');
const companyRoutes     = require('./routes/company');
const driveRoutes       = require('./routes/drive');
const applicationRoutes = require('./routes/application');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(requestLogger());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});
app.use('/api/', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',       healthRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/companies',    companyRoutes);
app.use('/api/drives',       driveRoutes);
app.use('/api/applications', applicationRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
    },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
