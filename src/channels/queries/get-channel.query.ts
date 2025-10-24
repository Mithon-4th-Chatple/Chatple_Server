import { ChannelType } from '../entities/channel.entity';

export class GetChannelListQuery {
  constructor(
    public readonly userId: string,
    public readonly orgId: string,
    public readonly classId: string | undefined,
    public readonly type: ChannelType | undefined,
    public readonly searchQuery: string | undefined,
  ) {}
}

export class GetChannelDetailQuery {
  constructor(
    public readonly channelId: string,
    public readonly userId: string,
  ) {}
}

export class GetUnreadCountQuery {
  constructor(
    public readonly channelId: string,
    public readonly userId: string,
  ) {}
}

export class GetJoinRequestsQuery {
  constructor(
    public readonly channelId: string,
    public readonly status: string | undefined,
  ) {}
}

