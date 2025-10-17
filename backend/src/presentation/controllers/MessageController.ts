import { Response } from 'express';
import { AuthenticatedRequest, CreateMessageDto, MessageQueryParams } from '@/src/shared/types/interfaces';
import { getActiveDataSource } from '@/src/shared/utils/database';
import { Message } from '@/src/domain/message/entities/Message';
import { User } from '@/src/domain/user/entities/User';
import { MessageType } from '@/src/shared/types/enums';
import { SocketManager } from '@/src/infrastructure/socket/SocketManager';
import { Repository } from 'typeorm';

export class MessageController {
  private messageRepository: Repository<Message> | null = null;
  private userRepository: Repository<User> | null = null;

  constructor(private socketManager: SocketManager) {}

  private getMessageRepository(): Repository<Message> {
    if (!this.messageRepository) {
      this.messageRepository = getActiveDataSource().getRepository(Message);
    }
    return this.messageRepository;
  }

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = getActiveDataSource().getRepository(User);
    }
    return this.userRepository;
  }

  sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const messageDto: CreateMessageDto = req.body;
      const { content, type, receiverId } = messageDto;
      const senderId = req.user!.id;

      if (!content || !type) {
        res.status(400).json({ error: 'Content and type are required' });
        return;
      }

      if (type === MessageType.DIRECT && !receiverId) {
        res.status(400).json({ error: 'Receiver ID is required for direct messages' });
        return;
      }

      const userRepo = this.getUserRepository();
      const messageRepo = this.getMessageRepository();

      if (type === MessageType.DIRECT) {
        const receiver = await userRepo.findOne({ where: { id: receiverId } });
        if (!receiver) {
          res.status(404).json({ error: 'Receiver not found' });
          return;
        }
      }

      const message = type === MessageType.DIRECT 
        ? Message.createDirectMessage(content, senderId, receiverId)
        : Message.createGeneralMessage(content, senderId);

      const savedMessage = await messageRepo.save(message);
      const messageWithSender = await messageRepo.findOne({
        where: { id: savedMessage.id },
        relations: ['sender', 'receiver']
      });

      // Emit message via Socket.IO
      this.socketManager.emitMessage(messageWithSender!);

      res.status(201).json({ message: messageWithSender });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getGeneralMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const queryParams: MessageQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 50, 100)
      };
      const skip = (queryParams.page! - 1) * queryParams.limit!;
      const messageRepo = this.getMessageRepository();

      const [messages, total] = await messageRepo.findAndCount({
        where: { type: MessageType.GENERAL },
        relations: ['sender'],
        order: { createdAt: 'DESC' },
        skip,
        take: queryParams.limit!
      });

      res.json({
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: queryParams.page!,
          limit: queryParams.limit!,
          total,
          totalPages: Math.ceil(total / queryParams.limit!)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getDirectMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;
      const queryParams: MessageQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 50, 100)
      };
      const skip = (queryParams.page! - 1) * queryParams.limit!;
      const messageRepo = this.getMessageRepository();

      const otherUserId = parseInt(userId);
      
      const [messages, total] = await messageRepo.findAndCount({
        where: [
          { senderId: currentUserId, receiverId: otherUserId, type: MessageType.DIRECT },
          { senderId: otherUserId, receiverId: currentUserId, type: MessageType.DIRECT }
        ],
        relations: ['sender', 'receiver'],
        order: { createdAt: 'DESC' },
        skip,
        take: queryParams.limit!
      });

      res.json({
        messages: messages.reverse(), // Show oldest first
        pagination: {
          page: queryParams.page!,
          limit: queryParams.limit!,
          total,
          totalPages: Math.ceil(total / queryParams.limit!)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const userRepo = this.getUserRepository();
      
      const users = await userRepo.find({
        where: {},
        select: ['id', 'name', 'email'],
        order: { name: 'ASC' }
      });

      // Exclude current user
      const otherUsers = users.filter(user => user.id !== currentUserId);

      res.json({ users: otherUsers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}