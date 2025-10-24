import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @IsString()
  @IsOptional()
  classId?: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isReadonly?: boolean;

  @IsString()
  @IsOptional()
  assignmentId?: string;

  @IsString()
  @IsOptional()
  groupId?: string;
}

