const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');
const { initSocket } = require('./sockets/socketManager');

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL');

    const server = http.createServer(app);
    initSocket(server);

    server.listen(config.port, "0.0.0.0", () => {
      console.log(`Project Management API and Socket.io listening on port ${config.port}`);
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
