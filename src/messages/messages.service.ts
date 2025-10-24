import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageMention } from './entities/message-mention.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageMention)
    private mentionRepository: Repository<MessageMention>,
  ) {}

  async createMessage(channelId: string, senderId: string, dto: CreateMessageDto) {
    const message = this.messageRepository.create({
      channelId,
      senderId,
      text: dto.text,
      attachments: dto.attachments,
    });

    const savedMessage = await this.messageRepository.save(message);

    if (dto.mentions && dto.mentions.length > 0) {
      const mentions = dto.mentions.map((userId) =>
        this.mentionRepository.create({
          messageId: savedMessage.id,
          targetUserId: userId,
        }),
      );
      await this.mentionRepository.save(mentions);
    }

    return savedMessage;
  }

  async getMessages(channelId: string) {
    return this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.channelId = :channelId', { channelId })
      .andWhere('message.deletedAt IS NULL')
      .orderBy('message.createdAt', 'DESC')
      .take(50)
      .getMany();
  }
}

