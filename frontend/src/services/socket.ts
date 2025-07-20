import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'https://engageai-api.onrender.com';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      // Get JWT token for authentication
      const token = localStorage.getItem('engageai_token');
      
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: token || ''
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
        // If authentication fails, try to reconnect with fresh token
        if (error.message === 'Authentication error') {
          const freshToken = localStorage.getItem('engageai_token');
          if (freshToken && freshToken !== token) {
            this.socket?.auth = { token: freshToken };
            this.socket?.connect();
          }
        }
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(eventId: string): void {
    if (this.socket) {
      this.socket.emit('session:join', { eventId });
      console.log('🎯 Joining session:', eventId);
    }
  }

  submitPoll(eventId: string, pollId: string, answer: string): void {
    if (this.socket) {
      this.socket.emit('poll:submit', { eventId, pollId, answer });
      console.log('📊 Submitting poll:', { pollId, answer });
    }
  }

  submitQuestion(eventId: string, question: string): void {
    if (this.socket) {
      this.socket.emit('qa:submit', { eventId, question });
      console.log('❓ Submitting question:', question);
    }
  }

  onSessionUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('session:update', callback);
    }
  }

  onPollUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('poll:update', callback);
    }
  }

  onNewQuestion(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('qa:new', callback);
    }
  }

  onError(callback: (error: any) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();