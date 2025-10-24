import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  AddMemberCommand,
  RemoveMemberCommand,
  UpdateLastReadCommand,
} from '../commands/add-member.command';
import { ChannelMember } from '../entities/channel-member.entity';

@CommandHandler(AddMemberCommand)
export class AddMemberHandler implements ICommandHandler<AddMemberCommand> {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: AddMemberCommand): Promise<void> {
    const existingMember = await this.channelMemberRepository.findOne({
      where: {
        channelId: command.channelId,
        userId: command.userId,
      },
    });

    if (existingMember) {
      throw new BadRequestException('이미 가입된 채널입니다.');
    }

    const member = this.channelMemberRepository.create({
      channelId: command.channelId,
      userId: command.userId,
      roleInChannel: command.roleInChannel,
    });

    await this.channelMemberRepository.save(member);
  }
}

@CommandHandler(RemoveMemberCommand)
export class RemoveMemberHandler implements ICommandHandler<RemoveMemberCommand> {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    await this.channelMemberRepository.delete({
      channelId: command.channelId,
      userId: command.userId,
    });
  }
}

@CommandHandler(UpdateLastReadCommand)
export class UpdateLastReadHandler implements ICommandHandler<UpdateLastReadCommand> {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: UpdateLastReadCommand): Promise<void> {
    await this.channelMemberRepository.update(
      {
        channelId: command.channelId,
        userId: command.userId,
      },
      {
        lastReadAt: new Date(),
      },
    );
  }
}

