export class PinMessageCommand {
  constructor(
    public readonly channelId: string,
    public readonly messageId: string,
    public readonly pinnedBy: string,
  ) {}
}

export class UnpinMessageCommand {
  constructor(
    public readonly channelId: string,
    public readonly messageId: string,
  ) {}
}

