/**
 * Centralized Socket.IO Context
 * 
 * Manages a single persistent, memory-efficient WebSocket connection shared across all screens.
 * Uses window.location.origin when deployed or tunneled to avoid Mixed Content (HTTP vs HTTPS) blocks.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const rawUrl = import.meta.env.VITE_SOCKET_URL;
    const socketEndpoint =
      rawUrl && rawUrl !== '/' ? rawUrl : window.location.origin;

    const s = io(socketEndpoint, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('[Socket.IO] Connected to real-time server:', s.id);
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('[Socket.IO] Disconnected from server');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
