import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  key: string;

  @IsString()
  url: string;

  @IsString()
  name: string;

  @IsString()
  contentType: string;
}

export class CreateMessageDto {
  @IsString()
  text: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];
}

