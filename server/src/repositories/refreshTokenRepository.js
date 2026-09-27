const { query } = require('../config/db');

async function create({ userId, tokenHash, expiresAt }) {
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function findValidByHash(tokenHash) {
  const result = await query(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function revokeByHash(tokenHash) {
  const result = await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function revokeAllForUser(userId) {
  await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL`,
    [userId]
  );
}

module.exports = {
  create,
  findValidByHash,
  revokeByHash,
  revokeAllForUser,
};
