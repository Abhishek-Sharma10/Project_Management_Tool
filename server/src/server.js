const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');

    const server = app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}`);
      console.log(`Environment: ${config.env}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down`);
      server.close(async () => {
        await pool.end();
        console.log('PostgreSQL pool closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
