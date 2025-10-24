import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('message_mentions')
export class MessageMention {
  @PrimaryColumn()
  messageId: string;

  @PrimaryColumn()
  targetUserId: string;

  @ManyToOne(() => Message, (message) => message.mentions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;
}

