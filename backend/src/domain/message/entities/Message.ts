import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { MessageType } from '@/src/shared/types/enums';
import { User } from '@/src/domain/user/entities/User';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  @IsNotEmpty()
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.GENERAL
  })
  @IsEnum(MessageType)
  type: MessageType;

  @Column({ type: 'int' })
  senderId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'int', nullable: true })
  receiverId?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @CreateDateColumn()
  createdAt: Date;

  public static createGeneralMessage(content: string, senderId: number): Message {
    const message = new Message();
    message.content = content;
    message.type = MessageType.GENERAL;
    message.senderId = senderId;
    return message;
  }

  public static createDirectMessage(content: string, senderId: number, receiverId: number): Message {
    const message = new Message();
    message.content = content;
    message.type = MessageType.DIRECT;
    message.senderId = senderId;
    message.receiverId = receiverId;
    return message;
  }

  public isDirectMessage(): boolean {
    return this.type === MessageType.DIRECT;
  }

  public isGeneralMessage(): boolean {
    return this.type === MessageType.GENERAL;
  }
}