/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's serverless functions.
 * All /api/* requests are handled here.
 */

const path = require('path');

// Ensure both root and backend/node_modules are resolved in all environments
const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

// Load env from backend/.env if present (fallback for local emulation)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
} catch (e) {
  // Ignore missing local env file on Vercel
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB, getDBStatus } = require('../backend/src/config/db');
const apiRoutes = require('../backend/src/routes/api');
const errorHandler = require('../backend/src/middleware/errorHandler');

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS Configuration — allow requests from all origins
app.use(cors({ origin: true, credentials: true }));

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// URL Normalization Middleware for Vercel Rewrites
app.use((req, res, next) => {
  const matched = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
  if (matched && matched.startsWith('/api') && (req.url === '/api/index.js' || req.url === '/api' || req.url === '/api/')) {
    req.url = matched;
  }
  next();
});

// Database Connection Middleware for Serverless Lifecycle
let dbPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB();
    }
    await dbPromise;
    next();
  } catch (err) {
    console.error('[Database Middleware Error]', err.message);
    // Continue: repoService seamlessly uses embedded store if MongoDB fails
    next();
  }
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication requests, please try again in a few minutes.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Health check endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    status: 'healthy',
    system: 'Intelligent Financial Fraud Detection API',
    environment: 'vercel-serverless',
    database: getDBStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes at both /api and / to guarantee route matching regardless of rewrite format
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Fallback 404 handler for API — ALWAYS returns JSON
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`
  });
});

// Centralized Error Handler — ALWAYS returns JSON
app.use(errorHandler);

module.exports = app;
