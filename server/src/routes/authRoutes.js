const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Stricter limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateUser, authController.me);

module.exports = router;
