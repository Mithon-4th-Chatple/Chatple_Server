import { IsString } from 'class-validator';

export class PinMessageDto {
  @IsString()
  messageId: string;
}

