import { ChannelType } from '../entities/channel.entity';

export class CreateChannelCommand {
  constructor(
    public readonly orgId: string,
    public readonly classId: string | undefined,
    public readonly type: ChannelType,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly isReadonly: boolean,
    public readonly assignmentId: string | undefined,
    public readonly groupId: string | undefined,
    public readonly createdBy: string,
  ) {}
}

