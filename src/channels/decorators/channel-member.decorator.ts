import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ChannelMember } from '../entities/channel-member.entity';

export const CurrentChannelMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ChannelMember => {
    const request = ctx.switchToHttp().getRequest();
    return request.channelMember;
  },
);

