/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's serverless functions.
 * All /api/* requests are handled here.
 */

// Load env from backend/.env if present
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('../backend/src/config/db');
const apiRoutes = require('../backend/src/routes/api');
const errorHandler = require('../backend/src/middleware/errorHandler');

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS — allow all origins in serverless (Vercel handles domain security)
app.use(cors({ origin: true, credentials: true }));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes — mounted at root because Vercel rewrites /api/* → this file
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Intelligent Financial Fraud Detection API',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use(errorHandler);

// Connect DB then export (Vercel calls handler on each request)
let dbConnected = false;
const handler = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  return app(req, res);
};

module.exports = handler;
