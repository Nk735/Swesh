import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production URL for Render deployment
const PRODUCTION_URL = 'https://swesh-backend.onrender.com';

// Get the base URL based on environment
const getBaseUrl = (): string => {
  // In development, use localhost
  if (__DEV__) {
    console.log('[Socket] Dev mode - using localhost:3000');
    return 'http://localhost:3000';
  }
  
  // In production, use Render
  return PRODUCTION_URL;
};

const BASE_URL = getBaseUrl();

console.log(`[Socket] Environment: ${__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`[Socket] Socket URL: ${BASE_URL}`);

class SocketService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Connect to the Socket.IO server
   */
  async connect(): Promise<void> {
    // If already connected, return immediately
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      console.log('[Socket] Connection in progress, waiting...');
      return this.connectionPromise;
    }

    // Start new connection
    this.connectionPromise = this._doConnect();
    
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async _doConnect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        console.log('[Socket] No auth token, skipping connection');
        throw new Error('No authentication token');
      }

      console.log('[Socket] Connecting...');

      this.socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          console.log('[Socket] Connected successfully');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('[Socket] Connection error:', error.message);
          reject(error);
        });

        this.socket!.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
        });
      });
    } catch (error) {
      console.error('[Socket] Connect failed:', error);
      this.socket = null;
      throw error;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[Socket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a chat room
   */
  joinChat(matchId: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot join chat - not connected');
      return;
    }
    console.log(`[Socket] Joining chat: ${matchId}`);
    this.socket.emit('join_chat', matchId);
  }

  /**
   * Leave a chat room
   */
  leaveChat(matchId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    console.log(`[Socket] Leaving chat: ${matchId}`);
    this.socket.emit('leave_chat', matchId);
  }

  /**
   * Send a message to a chat
   */
  sendMessage(matchId: string, content: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot send message - not connected');
      return;
    }
    console.log(`[Socket] Sending message to chat: ${matchId}`);
    this.socket.emit('send_message', { matchId, content });
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (data: { matchId: string; message: any }) => void): () => void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen for messages - socket not initialized');
      return () => {};
    }
    
    this.socket.on('new_message', callback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off('new_message', callback);
    };
  }

  /**
   * Start typing indicator
   */
  startTyping(matchId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('typing_start', matchId);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(matchId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('typing_stop', matchId);
  }

  /**
   * Listen for typing indicators
   */
  onTyping(callback: (data: { matchId: string; userId: string; isTyping: boolean }) => void): () => void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen for typing - socket not initialized');
      return () => {};
    }
    
    this.socket.on('user_typing', callback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off('user_typing', callback);
    };
  }

  /**
   * Confirm exchange for a match
   */
  confirmExchange(matchId: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot confirm exchange - not connected');
      return;
    }
    console.log(`[Socket] Confirming exchange for match: ${matchId}`);
    this.socket.emit('confirm_exchange', matchId);
  }

  /**
   * Listen for exchange status updates
   */
  onExchangeStatus(callback: (data: { matchId: string; status: string; confirmation: any }) => void): () => void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen for exchange status - socket not initialized');
      return () => {};
    }
    
    this.socket.on('exchange_status', callback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off('exchange_status', callback);
    };
  }

  /**
   * Listen for exchange completed events
   */
  onExchangeCompleted(callback: (data: { matchId: string; myItemTitle: string; theirItemTitle: string; otherUserNickname: string }) => void): () => void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen for exchange completed - socket not initialized');
      return () => {};
    }
    
    this.socket.on('exchange_completed', callback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off('exchange_completed', callback);
    };
  }

  /**
   * Listen for match updates
   */
  onMatchUpdate(callback: (data?: { type: string; matchId: string }) => void): () => void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen for match updates - socket not initialized');
      return () => {};
    }
    
    this.socket.on('match_update', callback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off('match_update', callback);
    };
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;