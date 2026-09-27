const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret);
}

/**
 * Store only a hash of the refresh token in the DB.
 * If the DB leaks, raw tokens remain unusable.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url ?? user.avatarUrl ?? null,
    createdAt: user.created_at ?? user.createdAt,
    updatedAt: user.updated_at ?? user.updatedAt,
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
  sanitizeUser,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
};
