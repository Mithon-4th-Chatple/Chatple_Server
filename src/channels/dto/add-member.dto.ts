import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ChannelMemberRole } from '../entities/channel-member.entity';

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsEnum(ChannelMemberRole)
  @IsOptional()
  roleInChannel?: ChannelMemberRole;
}

