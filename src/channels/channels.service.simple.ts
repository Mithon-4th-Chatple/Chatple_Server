import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelMember, ChannelMemberRole } from './entities/channel-member.entity';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
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

    const member = this.channelMemberRepository.create({
      channelId: savedChannel.id,
      userId,
      roleInChannel: ChannelMemberRole.OWNER,
    });

    await this.channelMemberRepository.save(member);

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

