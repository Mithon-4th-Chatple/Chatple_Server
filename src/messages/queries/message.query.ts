export class GetMessagesQuery {
  constructor(
    public readonly channelId: string,
    public readonly before: string | undefined,
    public readonly after: string | undefined,
    public readonly limit: number,
    public readonly searchQuery: string | undefined,
  ) {}
}

export class GetMessageQuery {
  constructor(public readonly messageId: string) {}
}

