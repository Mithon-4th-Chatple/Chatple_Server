import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }

  @Get('search')
  @ApiOperation({ summary: '사용자 검색 (멘션용)' })
  async searchUsers(@Query('q') query: string, @CurrentUser() user: User) {
    return this.usersService.searchUsers(query, user.orgId);
  }
}