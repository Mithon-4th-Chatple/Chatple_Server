import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateChannelDto } from './dto/create-channel.dto';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: '채널 생성 (교사 전용)' })
  async createChannel(
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: User,
  ) {
    return this.channelsService.createChannel(dto, user.orgId, user.id);
  }

  @Get()
  @ApiOperation({ summary: '채널 목록 조회' })
  async getChannels(@CurrentUser() user: User) {
    return this.channelsService.getChannelList(user.id, user.orgId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '읽음 처리' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.channelsService.updateLastRead(id, user.id);
    return { success: true };
  }
}

