import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  CreateMessageCommand,
  UpdateMessageCommand,
  DeleteMessageCommand,
} from '../commands/message.command';
import { Message } from '../entities/message.entity';
import { MessageMention } from '../entities/message-mention.entity';

@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<CreateMessageCommand> {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageMention)
    private mentionRepository: Repository<MessageMention>,
  ) {}

  async execute(command: CreateMessageCommand): Promise<Message> {
    const message = this.messageRepository.create({
      channelId: command.channelId,
      senderId: command.senderId,
      text: command.text,
      attachments: command.attachments,
    });

    const savedMessage = await this.messageRepository.save(message);

    if (command.mentions && command.mentions.length > 0) {
      const mentions = command.mentions.map((userId) =>
        this.mentionRepository.create({
          messageId: savedMessage.id,
          targetUserId: userId,
        }),
      );
      await this.mentionRepository.save(mentions);
    }

    return savedMessage;
  }
}

@CommandHandler(UpdateMessageCommand)
export class UpdateMessageHandler implements ICommandHandler<UpdateMessageCommand> {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async execute(command: UpdateMessageCommand): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: command.messageId },
    });

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    message.text = command.text;
    message.editedAt = new Date();

    return this.messageRepository.save(message);
  }
}

@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler implements ICommandHandler<DeleteMessageCommand> {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async execute(command: DeleteMessageCommand): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: command.messageId },
    });

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    message.deletedAt = new Date();
    await this.messageRepository.save(message);
  }
}

