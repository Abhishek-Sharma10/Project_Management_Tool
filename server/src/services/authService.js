const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
  sanitizeUser,
} = require('../utils/tokens');
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../utils/validators');

const BCRYPT_ROUNDS = 12;

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function register({ name, email, password }) {
  const errors = validateRegisterInput({ name, email, password });
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (await userRepository.emailExists(normalizedEmail)) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await userRepository.createUser({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
  });

  return issueTokenPair(user);
}

async function login({ email, password }) {
  const errors = validateLoginInput({ email, password });
  if (errors.length) {
    throw new AppError('Validation failed', 400, { errors });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);

  // Same generic message prevents email enumeration
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new AppError('Invalid email or password', 401);
  }

  return issueTokenPair(user);
}

async function refresh(refreshToken) {
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new AppError('Refresh token is required', 400);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (payload.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }

  const stored = await refreshTokenRepository.findValidByHash(
    hashToken(refreshToken)
  );
  if (!stored) {
    throw new AppError('Refresh token has been revoked or expired', 401);
  }

  // Rotate: revoke old token, issue a new pair
  await refreshTokenRepository.revokeByHash(hashToken(refreshToken));

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new AppError('User not found', 401);
  }

  return issueTokenPair(user);
}

async function logout(refreshToken) {
  if (refreshToken && typeof refreshToken === 'string') {
    await refreshTokenRepository.revokeByHash(hashToken(refreshToken));
  }
  return { loggedOut: true };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return sanitizeUser(user);
}

async function updateProfile(userId, { name, avatarUrl }) {
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Name cannot be empty', 400);
    }
  }

  const updated = await userRepository.updateUser(userId, {
    name: name ? name.trim() : undefined,
    avatarUrl: avatarUrl !== undefined ? (avatarUrl?.trim() || null) : undefined,
  });

  return sanitizeUser(updated);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    throw new AppError('Incorrect current password', 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepository.updatePassword(userId, passwordHash);

  return { success: true };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};

