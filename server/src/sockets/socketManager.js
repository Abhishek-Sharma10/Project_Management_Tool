const { Server } = require('socket.io');
const config = require('../config/env');
const { verifyAccessToken } = require('../utils/tokens');

let io = null;

function initSocket(httpServer) {
  const allowedOrigins = [config.clientUrl];
  if (config.isDev) {
    allowedOrigins.push('http://localhost:5174');
    allowedOrigins.push('http://127.0.0.1:5173');
    allowedOrigins.push('http://127.0.0.1:5174');
  }

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.io connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      // Allow unauthenticated socket connection, but with restricted access
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      return next();
    } catch (err) {
      // Invalid token, proceed without user identity
      return next();
    }
  });

  io.on('connection', (socket) => {
    // If authenticated, join user personal room for private notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Client requests to join a project room for collaborative updates
    socket.on('join:project', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
      }
    });

    // Client leaves a project room
    socket.on('leave:project', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    // Client requests to authenticate socket after login
    socket.on('authenticate', (token) => {
      try {
        const payload = verifyAccessToken(token);
        socket.userId = payload.sub;
        socket.join(`user:${socket.userId}`);
      } catch (err) {
        // invalid token
      }
    });

    socket.on('disconnect', () => {
      // cleanup handled by socket.io automatically
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToProject(projectId, event, data) {
  if (io && projectId) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
};
