import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'https://engageai-api.onrender.com';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
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

  getSocket(): Socket | null {
    return this.socket;
  }

  // Event-specific methods
  joinSession(eventId: string): void {
    if (this.socket) {
      this.socket.emit('session:join', { eventId });
    }
  }

  submitPoll(eventId: string, pollId: string, answer: string): void {
    if (this.socket) {
      this.socket.emit('poll:submit', { eventId, pollId, answer });
    }
  }

  submitQuestion(eventId: string, question: string): void {
    if (this.socket) {
      this.socket.emit('qa:submit', { eventId, question });
    }
  }

  // Listeners
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

  // Remove listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();