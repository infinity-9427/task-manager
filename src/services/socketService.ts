import { io, Socket } from 'socket.io-client';
import { SocketEvents, type Notification, Message, Task, Conversation, User } from '@/types/api';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // Only initialize on client side
      this.initializeSocket();
    }
  }

  private initializeSocket(): void {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';
    const token = this.getToken();

    if (!token) {
      console.warn('No authentication token found for socket connection');
      return;
    }

    this.socket = io(apiUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.setupEventListeners();
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get from cookies first
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Fallback to localStorage
    return localStorage.getItem('accessToken');
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connectionError', { error: error.message });
      this.scheduleReconnect();
    });

    // Application-specific events
    this.socket.on('message_received', (message: Message) => {
      this.emit('messageReceived', message);
    });

    this.socket.on('notification_received', (notification: Notification) => {
      this.emit('notificationReceived', notification);
    });

    this.socket.on('user_status_changed', (data: { userId: number; isOnline: boolean }) => {
      this.emit('userStatusChanged', data);
    });

    this.socket.on('typing_indicator', (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      this.emit('typingIndicator', data);
    });

    this.socket.on('task_updated', (task: Task) => {
      this.emit('taskUpdated', task);
    });

    this.socket.on('conversation_updated', (conversation: Conversation) => {
      this.emit('conversationUpdated', conversation);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 30000); // Max 30 seconds
      
      if (this.socket) {
        this.socket.connect();
      } else {
        this.initializeSocket();
      }
    }, this.reconnectInterval);
  }

  // Public methods for emitting events
  joinConversation(conversationId: number): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: number): void {
    this.socket?.emit('leave_conversation', { conversationId });
  }

  sendMessage(data: { conversationId: number; content: string; messageType?: string }): void {
    this.socket?.emit('send_message', data);
  }

  startTyping(conversationId: number): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: number): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.eventListeners.clear();
  }

  // High-level convenience methods
  onMessageReceived(callback: (message: Message) => void): () => void {
    this.on('messageReceived', callback);
    return () => this.off('messageReceived', callback);
  }

  onNotificationReceived(callback: (notification: Notification) => void): () => void {
    this.on('notificationReceived', callback);
    return () => this.off('notificationReceived', callback);
  }

  onUserStatusChanged(callback: (data: { userId: number; isOnline: boolean }) => void): () => void {
    this.on('userStatusChanged', callback);
    return () => this.off('userStatusChanged', callback);
  }

  onTypingIndicator(callback: (data: { conversationId: number; userId: number; isTyping: boolean }) => void): () => void {
    this.on('typingIndicator', callback);
    return () => this.off('typingIndicator', callback);
  }

  onTaskUpdated(callback: (task: Task) => void): () => void {
    this.on('taskUpdated', callback);
    return () => this.off('taskUpdated', callback);
  }

  onConversationUpdated(callback: (conversation: Conversation) => void): () => void {
    this.on('conversationUpdated', callback);
    return () => this.off('conversationUpdated', callback);
  }

  onConnectionStatusChanged(callback: (isConnected: boolean) => void): () => void {
    this.on('connected', () => callback(true));
    this.on('disconnected', () => callback(false));
    
    return () => {
      this.off('connected');
      this.off('disconnected');
    };
  }

  // Token update method (for when user logs in/out)
  updateToken(newToken: string | null): void {
    if (newToken) {
      this.disconnect();
      this.initializeSocket();
    } else {
      this.disconnect();
    }
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
export default socketService;
