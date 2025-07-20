import { useEffect, useRef } from 'react';
import socketService from '../services/socket';

export const useSocket = (eventId?: string) => {
  const socketRef = useRef(socketService.connect());

  useEffect(() => {
    if (eventId) {
      socketService.joinSession(eventId);
    }
    return () => {
      socketService.removeAllListeners();
      if (!eventId) {
        socketService.disconnect();
      }
    };
  }, [eventId]);

  return socketRef.current;
};