import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageListQueryDto } from './dto/message-list-query.dto';
import { ChannelAccessGuard } from '../channels/guards/channel-access.guard';
@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ChannelAccessGuard)
@Controller('channels/:channelId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: '메시지 전송' })
  async createMessage(
    @Param('channelId') channelId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.messagesService.createMessage(channelId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '메시지 목록 조회' })
  async getMessages(
    @Param('channelId') channelId: string,
  ) {
    return this.messagesService.getMessages(channelId);
  }

}
