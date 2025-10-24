import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Channel } from './channel.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('channel_pins')
export class ChannelPin {
  @PrimaryColumn()
  channelId: string;

  @PrimaryColumn()
  messageId: string;

  @Column()
  pinnedBy: string;

  @CreateDateColumn()
  pinnedAt: Date;

  @ManyToOne(() => Channel, (channel) => channel.pins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;
}

