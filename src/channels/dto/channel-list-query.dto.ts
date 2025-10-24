import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class ChannelListQueryDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @IsString()
  q?: string;
}

