import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL di produzione Railway
const PRODUCTION_URL = 'https://swesh-production-ee2e.up.railway.app';

// Rileva automaticamente il base URL
const getBaseUrl = (): string => {
  // In sviluppo, usa sempre localhost
  if (__DEV__) {
    return 'http://localhost:3000';
  }
  // In produzione, usa Railway
  return PRODUCTION_URL;
};

export type ChatMessage = {
  _id: string;
  content: string;
  senderId: string;
  createdAt: string;
  read: boolean;
};

export type TypingEvent = {
  matchId: string;
  userId: string;
  isTyping: boolean;
};

export type ExchangeStatus = {
  matchId: string;
  status: 'active' | 'completed' | 'archived';
  confirmation: {
    userAConfirmed: boolean;
    userAConfirmedAt?: string;
    userBConfirmed: boolean;
    userBConfirmedAt?: string;
  };
};

export type NewMessageEvent = {
  matchId: string;
  message: ChatMessage;
};

export type MatchUpdateEvent = {
  type: 'new_match' | 'new_message' | 'match_confirmed' | 'match_cancelled';
  matchId: string;
};

export type MatchArchivedEvent = {
  matchId: string;
  reason: 'item_exchanged' | 'user_cancelled' | 'item_deleted' | 'admin';
  relatedMatchId?: string;
  itemTitle?: string;
};

export type ExchangeCompletedEvent = {
  matchId: string;
  myItemTitle: string;
  theirItemTitle: string;
  otherUserNickname: string;
};

class SocketService {
  private socket: Socket | null = null;
  private connecting: boolean = false;

  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve(this.socket);
          } else if (!this.connecting) {
            clearInterval(checkConnection);
            resolve(null);
          }
        }, 100);
      });
    }

    this.connecting = true;

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.log('[Socket] No auth token, skipping connection');
        this.connecting = false;
        return null;
      }

      const baseUrl = getBaseUrl();
      console.log(`[Socket] Connecting to ${baseUrl}`);

      this.socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          console.log('[Socket] Connected');
          this.connecting = false;
          resolve(this.socket);
        });

        this.socket!.on('connect_error', (error) => {
          console.log('[Socket] Connection error:', error.message);
          this.connecting = false;
          reject(error);
        });

        this.socket!.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
        });
      });
    } catch (error) {
      console.error('[Socket] Connection failed:', error);
      this.connecting = false;
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Chat room management
  joinChat(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', matchId);
    }
  }

  leaveChat(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', matchId);
    }
  }

  // Messaging
  sendMessage(matchId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { matchId, content });
    }
  }

  // Typing indicators
  startTyping(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', matchId);
    }
  }

  stopTyping(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', matchId);
    }
  }

  // Exchange confirmation
  confirmExchange(matchId: string) {
    if (this.socket?.connected) {
      this.socket.emit('confirm_exchange', matchId);
    }
  }

  // Event listeners
  onNewMessage(callback: (data: NewMessageEvent) => void) {
    this.socket?.on('new_message', callback);
    return () => {
      this.socket?.off('new_message', callback);
    };
  }

  onNewMessageNotification(callback: (data: NewMessageEvent) => void) {
    this.socket?.on('new_message_notification', callback);
    return () => {
      this.socket?.off('new_message_notification', callback);
    };
  }

  onTyping(callback: (data: TypingEvent) => void) {
    this.socket?.on('user_typing', callback);
    return () => {
      this.socket?.off('user_typing', callback);
    };
  }

  onExchangeStatus(callback: (data: ExchangeStatus) => void) {
    this.socket?.on('exchange_status', callback);
    return () => {
      this.socket?.off('exchange_status', callback);
    };
  }

  onMatchUpdate(callback: (data: MatchUpdateEvent) => void) {
    this.socket?.on('match_update', callback);
    return () => {
      this.socket?.off('match_update', callback);
    };
  }

  onMatchArchived(callback: (data: MatchArchivedEvent) => void) {
    this.socket?.on('match_archived', callback);
    return () => {
      this.socket?.off('match_archived', callback);
    };
  }

  onExchangeCompleted(callback: (data: ExchangeCompletedEvent) => void) {
    this.socket?.on('exchange_completed', callback);
    return () => {
      this.socket?.off('exchange_completed', callback);
    };
  }

  // Remove all event listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.off('new_message');
      this.socket.off('new_message_notification');
      this.socket.off('user_typing');
      this.socket.off('exchange_status');
      this.socket.off('match_update');
      this.socket.off('match_archived');
      this.socket.off('exchange_completed');
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
