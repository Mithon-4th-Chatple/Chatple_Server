import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Channel } from './channel.entity';

export enum ChannelMemberRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
}

export enum NotifyLevel {
  ALL = 'all',
  MENTIONS = 'mentions',
  NONE = 'none',
}

@Entity('channel_members')
@Index(['channelId', 'userId'], { unique: true })
export class ChannelMember {
  @PrimaryColumn()
  channelId: string;

  @PrimaryColumn()
  userId: string;

  @Column({
    type: 'enum',
    enum: ChannelMemberRole,
    default: ChannelMemberRole.MEMBER,
  })
  roleInChannel: ChannelMemberRole;

  @Column({ type: 'timestamptz', nullable: true })
  lastReadAt: Date;

  @Column({
    type: 'enum',
    enum: NotifyLevel,
    default: NotifyLevel.ALL,
  })
  notifyLevel: NotifyLevel;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => Channel, (channel) => channel.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;
}

