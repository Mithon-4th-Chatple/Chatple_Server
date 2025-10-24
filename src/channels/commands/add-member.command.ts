import { ChannelMemberRole } from '../entities/channel-member.entity';

export class AddMemberCommand {
  constructor(
    public readonly channelId: string,
    public readonly userId: string,
    public readonly roleInChannel: ChannelMemberRole,
  ) {}
}

export class RemoveMemberCommand {
  constructor(
    public readonly channelId: string,
    public readonly userId: string,
  ) {}
}

export class UpdateLastReadCommand {
  constructor(
    public readonly channelId: string,
    public readonly userId: string,
  ) {}
}

