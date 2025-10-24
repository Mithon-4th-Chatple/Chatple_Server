import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  PinMessageCommand,
  UnpinMessageCommand,
} from '../commands/pin-message.command';
import { ChannelPin } from '../entities/channel-pin.entity';

@CommandHandler(PinMessageCommand)
export class PinMessageHandler implements ICommandHandler<PinMessageCommand> {
  constructor(
    @InjectRepository(ChannelPin)
    private channelPinRepository: Repository<ChannelPin>,
  ) {}

  async execute(command: PinMessageCommand): Promise<void> {
    const pinCount = await this.channelPinRepository.count({
      where: { channelId: command.channelId },
    });

    if (pinCount >= 3) {
      const oldestPin = await this.channelPinRepository.findOne({
        where: { channelId: command.channelId },
        order: { pinnedAt: 'ASC' },
      });

      if (oldestPin) {
        await this.channelPinRepository.delete({
          channelId: oldestPin.channelId,
          messageId: oldestPin.messageId,
        });
      }
    }

    const pin = this.channelPinRepository.create({
      channelId: command.channelId,
      messageId: command.messageId,
      pinnedBy: command.pinnedBy,
    });

    await this.channelPinRepository.save(pin);
  }
}

@CommandHandler(UnpinMessageCommand)
export class UnpinMessageHandler implements ICommandHandler<UnpinMessageCommand> {
  constructor(
    @InjectRepository(ChannelPin)
    private channelPinRepository: Repository<ChannelPin>,
  ) {}

  async execute(command: UnpinMessageCommand): Promise<void> {
    await this.channelPinRepository.delete({
      channelId: command.channelId,
      messageId: command.messageId,
    });
  }
}

