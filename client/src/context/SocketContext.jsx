import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../utils/tokenStorage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update authentication when user changes
  useEffect(() => {
    if (socketRef.current && isAuthenticated) {
      const token = getAccessToken();
      if (token) {
        socketRef.current.emit('authenticate', token);
      }
    }
  }, [user, isAuthenticated]);

  const joinProject = useCallback((projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('join:project', projectId);
    }
  }, []);

  const leaveProject = useCallback((projectId) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('leave:project', projectId);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    joinProject,
    leaveProject,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
