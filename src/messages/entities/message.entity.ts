import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import { MessageMention } from './message-mention.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['channelId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  channelId: string;

  @Column({ nullable: true })
  senderId: string;

  @Column({ nullable: true })
  systemType: string;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    key: string;
    url: string;
    name: string;
    size: number;
    contentType: string;
  }>;

  @Column({ nullable: true })
  threadRootId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Channel, (channel) => channel.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @OneToMany(() => MessageMention, (mention) => mention.message)
  mentions: MessageMention[];
}

