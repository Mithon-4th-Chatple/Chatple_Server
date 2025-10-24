import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelMember } from './channel-member.entity';
import { Message } from '../../messages/entities/message.entity';
import { ChannelPin } from './channel-pin.entity';

export enum ChannelType {
  GENERAL = 'general',
  ANNOUNCEMENT = 'announcement',
  ASSIGNMENT = 'assignment',
  GROUP = 'group',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  orgId: string;

  @Column({ nullable: true })
  @Index()
  classId: string;

  @Column({
    type: 'enum',
    enum: ChannelType,
  })
  @Index()
  type: ChannelType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isReadonly: boolean;

  @Column({ nullable: true })
  assignmentId: string;

  @Column({ nullable: true })
  groupId: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChannelMember, (member) => member.channel)
  members: ChannelMember[];

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];

  @OneToMany(() => ChannelPin, (pin) => pin.channel)
  pins: ChannelPin[];
}

