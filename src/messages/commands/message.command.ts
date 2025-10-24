export class CreateMessageCommand {
  constructor(
    public readonly channelId: string,
    public readonly senderId: string,
    public readonly text: string,
    public readonly attachments: any[] | undefined,
    public readonly mentions: string[] | undefined,
  ) {}
}

export class UpdateMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly text: string,
  ) {}
}

export class DeleteMessageCommand {
  constructor(public readonly messageId: string) {}
}

