import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useWebSocket = (onMessage) => {
  const { user } = useAuth();
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (!user) return;
    try {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => {
        ws.current.send(JSON.stringify({ type: 'auth', userId: user.id }));
      };
      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMessage?.(data);
        } catch {}
      };
      ws.current.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000);
      };
      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch {}
  }, [user, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return ws;
};
