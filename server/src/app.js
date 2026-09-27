const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS: allow configured frontend origin(s).
// In development also allow the Vite fallback port (5174) in case 5173 is taken.
const allowedOrigins = [config.clientUrl];
if (config.isDev) {
  allowedOrigins.push('http://localhost:5174');
  allowedOrigins.push('http://127.0.0.1:5173');
  allowedOrigins.push('http://127.0.0.1:5174');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
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

// Root route — simple liveness indicator for the API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Project Management API is running',
    environment: config.env,
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// 404 + centralized errors (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
