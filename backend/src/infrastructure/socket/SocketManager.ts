import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/src/infrastructure/config/jwt';
import { SocketEvents, MessageType } from '@/src/shared/types/enums';
import { Message } from '@/src/domain/message/entities/Message';
import { getActiveDataSource } from '@/src/shared/utils/database';
import { User } from '@/src/domain/user/entities/User';

export class SocketManager {
  private io: SocketIOServer;
  private onlineUsers: Map<number, string> = new Map(); // userId -> email

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token);
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const email = socket.data.email;
      
      console.log(`👤 User ${email} (ID: ${userId}) connected`);

      // Add to online users
      this.onlineUsers.set(userId, email);

      // Join general chat room
      socket.join('general');
      console.log(`🏠 User ${email} joined general room`);
      
      // Join personal room for direct messages
      socket.join(`user_${userId}`);
      console.log(`🔒 User ${email} joined personal room: user_${userId}`);

      // Notify others that user is online
      socket.broadcast.emit(SocketEvents.USER_ONLINE, {
        userId,
        email,
        onlineUsers: Array.from(this.onlineUsers.entries()).map(([id, userEmail]) => ({
          userId: id,
          email: userEmail
        }))
      });

      // Send current online users to the new user
      socket.emit(SocketEvents.USER_ONLINE, {
        userId,
        email,
        onlineUsers: Array.from(this.onlineUsers.entries()).map(([id, userEmail]) => ({
          userId: id,
          email: userEmail
        }))
      });

      socket.on(SocketEvents.JOIN_ROOM, (room: string) => {
        socket.join(room);
        console.log(`User ${socket.data.email} joined room ${room}`);
      });

      socket.on(SocketEvents.LEAVE_ROOM, (room: string) => {
        socket.leave(room);
        console.log(`User ${socket.data.email} left room ${room}`);
      });

      // Handle typing indicators
      socket.on(SocketEvents.USER_TYPING, (data: { receiverId?: number }) => {
        const typingData = {
          userId: socket.data.userId,
          email: socket.data.email,
          isTyping: true
        };

        if (data.receiverId) {
          // Direct message typing
          socket.to(`user_${data.receiverId}`).emit(SocketEvents.USER_TYPING, typingData);
        } else {
          // General chat typing
          socket.to('general').emit(SocketEvents.USER_TYPING, typingData);
        }
      });

      socket.on(SocketEvents.USER_STOP_TYPING, (data: { receiverId?: number }) => {
        const typingData = {
          userId: socket.data.userId,
          email: socket.data.email,
          isTyping: false
        };

        if (data.receiverId) {
          // Direct message stop typing
          socket.to(`user_${data.receiverId}`).emit(SocketEvents.USER_STOP_TYPING, typingData);
        } else {
          // General chat stop typing
          socket.to('general').emit(SocketEvents.USER_STOP_TYPING, typingData);
        }
      });

      // Handle message sending via WebSocket
      socket.on('message:send', async (data: { content: string, type: 'GENERAL' | 'DIRECT', receiverId?: string }) => {
        try {
          const { content, type, receiverId } = data;
          const senderId = socket.data.userId;

          if (!content || !type) {
            socket.emit('error', { message: 'Content and type are required' });
            return;
          }

          if (type === 'DIRECT' && !receiverId) {
            socket.emit('error', { message: 'Receiver ID is required for direct messages' });
            return;
          }

          const dataSource = getActiveDataSource();
          const messageRepo = dataSource.getRepository(Message);
          const userRepo = dataSource.getRepository(User);

          // Validate receiver for direct messages
          if (type === 'DIRECT') {
            const receiver = await userRepo.findOne({ where: { id: parseInt(receiverId!) } });
            if (!receiver) {
              socket.emit('error', { message: 'Receiver not found' });
              return;
            }
          }

          // Create message
          const message = type === 'DIRECT' 
            ? Message.createDirectMessage(content, senderId, parseInt(receiverId!))
            : Message.createGeneralMessage(content, senderId);

          const savedMessage = await messageRepo.save(message);
          const messageWithSender = await messageRepo.findOne({
            where: { id: savedMessage.id },
            relations: ['sender', 'receiver']
          });

          if (messageWithSender) {
            // Emit message to appropriate recipients
            this.emitMessage(messageWithSender);
            
            // Send confirmation to sender
            socket.emit(SocketEvents.MESSAGE_SENT, {
              event: SocketEvents.MESSAGE_SENT,
              message: {
                id: messageWithSender.id,
                content: messageWithSender.content,
                type: messageWithSender.type,
                sender: {
                  id: messageWithSender.sender.id,
                  name: messageWithSender.sender.name,
                  email: messageWithSender.sender.email
                },
                receiver: messageWithSender.receiver ? {
                  id: messageWithSender.receiver.id,
                  name: messageWithSender.receiver.name,
                  email: messageWithSender.receiver.email
                } : null,
                createdAt: messageWithSender.createdAt
              }
            });
          }
        } catch (error) {
          console.error('❌ Error handling message:send:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing events
      socket.on('typing:start', (data?: { receiverId?: string }) => {
        const typingData = {
          userId: socket.data.userId,
          email: socket.data.email,
          isTyping: true
        };

        if (data?.receiverId) {
          // Direct message typing
          socket.to(`user_${data.receiverId}`).emit(SocketEvents.USER_TYPING, typingData);
        } else {
          // General chat typing
          socket.to('general').emit(SocketEvents.USER_TYPING, typingData);
        }
      });

      socket.on('typing:stop', (data?: { receiverId?: string }) => {
        const typingData = {
          userId: socket.data.userId,
          email: socket.data.email,
          isTyping: false
        };

        if (data?.receiverId) {
          // Direct message stop typing
          socket.to(`user_${data.receiverId}`).emit(SocketEvents.USER_STOP_TYPING, typingData);
        } else {
          // General chat stop typing
          socket.to('general').emit(SocketEvents.USER_STOP_TYPING, typingData);
        }
      });

      socket.on('disconnect', () => {
        console.log(`👋 User ${email} (ID: ${userId}) disconnected`);
        
        // Remove from online users
        this.onlineUsers.delete(userId);
        
        // Notify others that user is offline
        socket.broadcast.emit(SocketEvents.USER_OFFLINE, {
          userId,
          email,
          onlineUsers: Array.from(this.onlineUsers.entries()).map(([id, userEmail]) => ({
            userId: id,
            email: userEmail
          }))
        });
      });
    });
  }

  public emitMessage(message: Message): void {
    try {
      console.log(`📤 Emitting message: ${message.type} - "${message.content}"`);
      
      if (message.isGeneralMessage()) {
        // Send to all users in general chat (broadcast to all connected users)
        console.log(`📢 Broadcasting general message to all users`);
        this.io.to('general').emit(SocketEvents.MESSAGE_RECEIVED, {
          event: SocketEvents.MESSAGE_RECEIVED,
          message: {
            id: message.id,
            content: message.content,
            type: message.type,
            sender: {
              id: message.sender.id,
              name: message.sender.name,
              email: message.sender.email
            },
            createdAt: message.createdAt
          }
        });
      } else if (message.isDirectMessage()) {
        const messageData = {
          event: SocketEvents.MESSAGE_RECEIVED,
          message: {
            id: message.id,
            content: message.content,
            type: message.type,
            sender: {
              id: message.sender.id,
              name: message.sender.name,
              email: message.sender.email
            },
            receiver: message.receiver ? {
              id: message.receiver.id,
              name: message.receiver.name,
              email: message.receiver.email
            } : null,
            createdAt: message.createdAt
          }
        };

        // Send to specific receiver
        console.log(`💬 Sending direct message to user_${message.receiverId}`);
        this.io.to(`user_${message.receiverId}`).emit(SocketEvents.MESSAGE_RECEIVED, messageData);
        
        // Also send confirmation to sender (different event)
        console.log(`✅ Sending confirmation to sender user_${message.senderId}`);
        this.io.to(`user_${message.senderId}`).emit(SocketEvents.MESSAGE_SENT, {
          event: SocketEvents.MESSAGE_SENT,
          message: messageData.message
        });
      }
    } catch (error) {
      console.error('❌ Error emitting message:', error);
    }
  }

  public getOnlineUsers(): Array<{userId: number, email: string}> {
    return Array.from(this.onlineUsers.entries()).map(([userId, email]) => ({
      userId,
      email
    }));
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  // Task-related socket events
  public emitTaskCreated(task: any): void {
    try {
      console.log(`📤 Emitting task created event: ${task.title}`);
      this.io.emit('taskCreated', {
        event: 'taskCreated',
        task
      });
    } catch (error) {
      console.error('❌ Error emitting task created event:', error);
    }
  }

  public emitTaskUpdated(task: any): void {
    try {
      console.log(`📤 Emitting task updated event: ${task.title}`);
      this.io.emit('taskUpdated', {
        event: 'taskUpdated',
        task
      });
    } catch (error) {
      console.error('❌ Error emitting task updated event:', error);
    }
  }

  public emitTaskDeleted(taskId: number): void {
    try {
      console.log(`📤 Emitting task deleted event: ${taskId}`);
      this.io.emit('taskDeleted', {
        event: 'taskDeleted',
        taskId
      });
    } catch (error) {
      console.error('❌ Error emitting task deleted event:', error);
    }
  }
}