const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');
const { asyncHandler } = require('./errorHandler');

/**
 * authenticateUser — answers "Who is the user?"
 * Expects: Authorization: Bearer <accessToken>
 * Attaches: req.user = { id, name, email }
 */
const authenticateUser = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    throw new AppError('Invalid access token', 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  next();
});

/** Alias used in later authorization phases */
const requireAuth = authenticateUser;

module.exports = {
  authenticateUser,
  requireAuth,
};
