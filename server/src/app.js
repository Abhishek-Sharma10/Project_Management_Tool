const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS: only allow the configured frontend origin
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Parse JSON bodies (limit keeps abuse payload size down)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging — concise in production, richer in development
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// Global rate limit — protects against brute-force / abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});
app.use('/api', limiter);

// Routes
app.use('/api/health', healthRoutes);

// 404 + centralized errors (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
