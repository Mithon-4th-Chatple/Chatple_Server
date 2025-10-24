import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetMessagesQuery, GetMessageQuery } from '../queries/message.query';
import { Message } from '../entities/message.entity';

@QueryHandler(GetMessagesQuery)
export class GetMessagesHandler implements IQueryHandler<GetMessagesQuery> {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async execute(query: GetMessagesQuery): Promise<Message[]> {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.channelId = :channelId', { channelId: query.channelId })
      .andWhere('message.deletedAt IS NULL')
      .leftJoinAndSelect('message.mentions', 'mentions');

    if (query.searchQuery) {
      qb.andWhere('message.text ILIKE :search', {
        search: `%${query.searchQuery}%`,
      });
    }

    if (query.before) {
      const beforeMsg = await this.messageRepository.findOne({
        where: { id: query.before },
      });
      if (beforeMsg) {
        qb.andWhere('message.createdAt < :beforeTime', {
          beforeTime: beforeMsg.createdAt,
        });
      }
    }

    if (query.after) {
      const afterMsg = await this.messageRepository.findOne({
        where: { id: query.after },
      });
      if (afterMsg) {
        qb.andWhere('message.createdAt > :afterTime', {
          afterTime: afterMsg.createdAt,
        });
      }
    }

    qb.orderBy('message.createdAt', 'DESC').take(query.limit);

    return qb.getMany();
  }
}

@QueryHandler(GetMessageQuery)
export class GetMessageHandler implements IQueryHandler<GetMessageQuery> {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async execute(query: GetMessageQuery): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: query.messageId },
      relations: ['mentions'],
    });

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    return message;
  }
}

