import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember, ChannelMemberRole } from './entities/channel-member.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createChannel(dto: CreateChannelDto, orgId: string, userId: string) {
    const channel = this.channelRepository.create({
      orgId,
      classId: dto.classId,
      type: dto.type,
      name: dto.name,
      description: dto.description,
      isReadonly: dto.isReadonly ?? false,
      assignmentId: dto.assignmentId,
      groupId: dto.groupId,
      createdBy: userId,
    });

    const savedChannel = await this.channelRepository.save(channel);

    // 채널 생성자를 OWNER로 추가
    const ownerMember = this.channelMemberRepository.create({
      channelId: savedChannel.id,
      userId,
      roleInChannel: ChannelMemberRole.OWNER,
    });
    await this.channelMemberRepository.save(ownerMember);

    // 같은 클래스의 모든 사용자를 MEMBER로 추가 (테스트용)
    if (dto.classId) {
      const classUsers = await this.userRepository.find({
        where: { classId: dto.classId, orgId }
      });
      
      const members = classUsers
        .filter(user => user.id !== userId) // 생성자는 이미 추가됨
        .map(user => this.channelMemberRepository.create({
          channelId: savedChannel.id,
          userId: user.id,
          roleInChannel: ChannelMemberRole.MEMBER,
        }));
      
      if (members.length > 0) {
        await this.channelMemberRepository.save(members);
      }
    }

    return savedChannel;
  }

  async getChannelList(userId: string, orgId: string) {
    return this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('channel.orgId = :orgId', { orgId })
      .orderBy('channel.createdAt', 'DESC')
      .getMany();
  }

  async updateLastRead(channelId: string, userId: string) {
    await this.channelMemberRepository.update(
      { channelId, userId },
      { lastReadAt: new Date() },
    );
  }
}

