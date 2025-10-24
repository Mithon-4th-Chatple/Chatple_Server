export class CreateJoinRequestCommand {
  constructor(
    public readonly channelId: string,
    public readonly applicantId: string,
  ) {}
}

export class ApproveJoinRequestCommand {
  constructor(
    public readonly requestId: string,
    public readonly actorId: string,
  ) {}
}

export class RejectJoinRequestCommand {
  constructor(
    public readonly requestId: string,
    public readonly actorId: string,
  ) {}
}

