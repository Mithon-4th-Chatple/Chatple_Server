import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CreateJoinRequestCommand,
  ApproveJoinRequestCommand,
  RejectJoinRequestCommand,
} from '../commands/join-request.command';
import {
  ChannelJoinRequest,
  JoinRequestStatus,
} from '../entities/channel-join-request.entity';
import { ChannelMember, ChannelMemberRole } from '../entities/channel-member.entity';

@CommandHandler(CreateJoinRequestCommand)
export class CreateJoinRequestHandler
  implements ICommandHandler<CreateJoinRequestCommand>
{
  constructor(
    @InjectRepository(ChannelJoinRequest)
    private joinRequestRepository: Repository<ChannelJoinRequest>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: CreateJoinRequestCommand): Promise<ChannelJoinRequest> {
    const existingMember = await this.channelMemberRepository.findOne({
      where: {
        channelId: command.channelId,
        userId: command.applicantId,
      },
    });

    if (existingMember) {
      throw new BadRequestException('이미 가입된 채널입니다.');
    }

    const existingRequest = await this.joinRequestRepository.findOne({
      where: {
        channelId: command.channelId,
        applicantId: command.applicantId,
        status: JoinRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('이미 가입 신청이 존재합니다.');
    }

    const request = this.joinRequestRepository.create({
      channelId: command.channelId,
      applicantId: command.applicantId,
    });

    return this.joinRequestRepository.save(request);
  }
}

@CommandHandler(ApproveJoinRequestCommand)
export class ApproveJoinRequestHandler
  implements ICommandHandler<ApproveJoinRequestCommand>
{
  constructor(
    @InjectRepository(ChannelJoinRequest)
    private joinRequestRepository: Repository<ChannelJoinRequest>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async execute(command: ApproveJoinRequestCommand): Promise<void> {
    const request = await this.joinRequestRepository.findOne({
      where: { id: command.requestId },
    });

    if (!request) {
      throw new NotFoundException('가입 신청을 찾을 수 없습니다.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('이미 처리된 신청입니다.');
    }

    request.status = JoinRequestStatus.APPROVED;
    request.actedBy = command.actorId;
    request.actedAt = new Date();

    await this.joinRequestRepository.save(request);

    const member = this.channelMemberRepository.create({
      channelId: request.channelId,
      userId: request.applicantId,
      roleInChannel: ChannelMemberRole.MEMBER,
    });

    await this.channelMemberRepository.save(member);
  }
}

@CommandHandler(RejectJoinRequestCommand)
export class RejectJoinRequestHandler
  implements ICommandHandler<RejectJoinRequestCommand>
{
  constructor(
    @InjectRepository(ChannelJoinRequest)
    private joinRequestRepository: Repository<ChannelJoinRequest>,
  ) {}

  async execute(command: RejectJoinRequestCommand): Promise<void> {
    const request = await this.joinRequestRepository.findOne({
      where: { id: command.requestId },
    });

    if (!request) {
      throw new NotFoundException('가입 신청을 찾을 수 없습니다.');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('이미 처리된 신청입니다.');
    }

    request.status = JoinRequestStatus.REJECTED;
    request.actedBy = command.actorId;
    request.actedAt = new Date();

    await this.joinRequestRepository.save(request);
  }
}

