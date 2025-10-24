import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMember } from '../entities/channel-member.entity';
import { Channel, ChannelType } from '../entities/channel.entity';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class ChannelAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const channelId = request.params.channelId || request.params.id;

    if (!user || !channelId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const member = await this.channelMemberRepository.findOne({
      where: {
        channelId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new ForbiddenException('채널 멤버가 아닙니다.');
    }

    request.channelMember = member;
    return true;
  }
}

@Injectable()
export class ChannelWriteGuard implements CanActivate {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const channelId = request.params.channelId || request.params.id;

    if (!user || !channelId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ForbiddenException('채널을 찾을 수 없습니다.');
    }

    if (channel.type === ChannelType.ANNOUNCEMENT && user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('공지 채널은 교사만 작성할 수 있습니다.');
    }

    if (channel.isReadonly && user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('읽기 전용 채널입니다.');
    }

    const member = await this.channelMemberRepository.findOne({
      where: {
        channelId,
        userId: user.id,
      },
    });

    if (!member) {
      throw new ForbiddenException('채널 멤버가 아닙니다.');
    }

    return true;
  }
}

