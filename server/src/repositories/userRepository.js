const { query } = require('../config/db');

async function createUser({ name, email, passwordHash }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, avatar_url, created_at, updated_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await query(
    `SELECT id, name, email, password_hash, avatar_url, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT id, name, email, avatar_url, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function emailExists(email) {
  const result = await query(
    `SELECT EXISTS (SELECT 1 FROM users WHERE email = $1) AS email_taken`,
    [email]
  );
  return result.rows[0].email_taken;
}

async function updateUser(id, { name, avatarUrl }) {
  const result = await query(
    `UPDATE users
     SET
       name = COALESCE($2, name),
       avatar_url = COALESCE($3, avatar_url)
     WHERE id = $1
     RETURNING id, name, email, avatar_url, created_at, updated_at`,
    [id, name || null, avatarUrl || null]
  );
  return result.rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  const result = await query(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1
     RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  emailExists,
  updateUser,
  updatePassword,
};

