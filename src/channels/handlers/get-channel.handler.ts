import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  GetChannelListQuery,
  GetChannelDetailQuery,
  GetUnreadCountQuery,
  GetJoinRequestsQuery,
} from '../queries/get-channel.query';
import { Channel } from '../entities/channel.entity';
import { ChannelMember } from '../entities/channel-member.entity';
import { ChannelJoinRequest } from '../entities/channel-join-request.entity';
import { Message } from '../../messages/entities/message.entity';

@QueryHandler(GetChannelListQuery)
export class GetChannelListHandler implements IQueryHandler<GetChannelListQuery> {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(query: GetChannelListQuery): Promise<Channel[]> {
    const qb = this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.members', 'member')
      .where('member.userId = :userId', { userId: query.userId })
      .andWhere('channel.orgId = :orgId', { orgId: query.orgId });

    if (query.classId) {
      qb.andWhere('channel.classId = :classId', { classId: query.classId });
    }

    if (query.type) {
      qb.andWhere('channel.type = :type', { type: query.type });
    }

    if (query.searchQuery) {
      qb.andWhere('channel.name ILIKE :search', {
        search: `%${query.searchQuery}%`,
      });
    }

    qb.orderBy('channel.createdAt', 'DESC');

    return qb.getMany();
  }
}

@QueryHandler(GetChannelDetailQuery)
export class GetChannelDetailHandler implements IQueryHandler<GetChannelDetailQuery> {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(query: GetChannelDetailQuery): Promise<any> {
    const channel = await this.channelRepository.findOne({
      where: { id: query.channelId },
      relations: ['pins', 'pins.message'],
    });

    if (!channel) {
      throw new NotFoundException('채널을 찾을 수 없습니다.');
    }

    const member = await this.channelMemberRepository.findOne({
      where: {
        channelId: query.channelId,
        userId: query.userId,
      },
    });

    return {
      ...channel,
      myMembership: member,
    };
  }
}

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async execute(query: GetUnreadCountQuery): Promise<number> {
    const member = await this.channelMemberRepository.findOne({
      where: {
        channelId: query.channelId,
        userId: query.userId,
      },
    });

    if (!member || !member.lastReadAt) {
      return this.messageRepository.count({
        where: { channelId: query.channelId },
      });
    }

    return this.messageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId: query.channelId })
      .andWhere('message.createdAt > :lastReadAt', {
        lastReadAt: member.lastReadAt,
      })
      .andWhere('message.deletedAt IS NULL')
      .getCount();
  }
}

@QueryHandler(GetJoinRequestsQuery)
export class GetJoinRequestsHandler implements IQueryHandler<GetJoinRequestsQuery> {
  constructor(
    @InjectRepository(ChannelJoinRequest)
    private joinRequestRepository: Repository<ChannelJoinRequest>,
  ) {}

  async execute(query: GetJoinRequestsQuery): Promise<ChannelJoinRequest[]> {
    const qb = this.joinRequestRepository
      .createQueryBuilder('request')
      .where('request.channelId = :channelId', { channelId: query.channelId });

    if (query.status) {
      qb.andWhere('request.status = :status', { status: query.status });
    }

    qb.orderBy('request.createdAt', 'DESC');

    return qb.getMany();
  }
}

