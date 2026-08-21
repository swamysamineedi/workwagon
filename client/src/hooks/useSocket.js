import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../utils/storage';

/**
 * useSocket
 *
 * Creates and manages a socket.io-client connection to the Work Wagon backend.
 * Sends the JWT token in the handshake so the server can authenticate the socket.
 *
 * The socket connects to the same origin as the page (Vite proxies /socket.io
 * to localhost:5000 during dev). In production set VITE_API_URL.
 *
 * Returns:
 *  socket  — the socket instance (stable ref — never changes identity)
 *  connected — boolean connection state
 *
 * Usage:
 *  const { socket, connected } = useSocket();
 *  useEffect(() => {
 *    socket.on('new-message', handler);
 *    return () => socket.off('new-message', handler);
 *  }, [socket]);
 */
export function useSocket() {
  const socketRef  = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();

    // Connect to the backend — same origin works because Vite proxies /socket.io
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const socket = io(SOCKET_URL, {
      auth: { token },
      // Try websocket first, fall back to polling
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Only create the socket once

  return { socket: socketRef.current, connected };
}
