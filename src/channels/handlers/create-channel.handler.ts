import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChannelCommand } from '../commands/create-channel.command';
import { Channel } from '../entities/channel.entity';
import { ChannelMember, ChannelMemberRole } from '../entities/channel-member.entity';

@CommandHandler(CreateChannelCommand)
export class CreateChannelHandler implements ICommandHandler<CreateChannelCommand> {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: CreateChannelCommand): Promise<Channel> {
    const channel = this.channelRepository.create({
      orgId: command.orgId,
      classId: command.classId,
      type: command.type,
      name: command.name,
      description: command.description,
      isReadonly: command.isReadonly,
      assignmentId: command.assignmentId,
      groupId: command.groupId,
      createdBy: command.createdBy,
    });

    const savedChannel = await this.channelRepository.save(channel);

    const member = this.channelMemberRepository.create({
      channelId: savedChannel.id,
      userId: command.createdBy,
      roleInChannel: ChannelMemberRole.OWNER,
    });

    await this.channelMemberRepository.save(member);

    return savedChannel;
  }
}

