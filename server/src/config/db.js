const { Pool } = require('pg');
const config = require('./env');

/**
 * Shared PostgreSQL connection pool.
 * Why a pool? Opening a new TCP connection per request is expensive;
 * a pool reuses connections and caps concurrency safely.
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  // Fail fast if the DB is unreachable during local development.
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Run a parameterized query.
 * Always pass user values as params — never interpolate into the SQL string.
 */
async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Checkout a client for multi-statement transactions.
 * Caller must release() in a finally block.
 */
async function getClient() {
  return pool.connect();
}

async function healthCheck() {
  const result = await query('SELECT NOW() AS now');
  return result.rows[0];
}

module.exports = {
  pool,
  query,
  getClient,
  healthCheck,
};
