import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { ChannelMember } from '../channels/entities/channel-member.entity';
import { ChannelJoinRequest } from '../channels/entities/channel-join-request.entity';
import { ChannelPin } from '../channels/entities/channel-pin.entity';
import { Message } from '../messages/entities/message.entity';
import { MessageMention } from '../messages/entities/message-mention.entity';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.databaseHost,
  port: configService.databasePort,
  username: configService.databaseUser,
  password: configService.databasePassword,
  database: configService.databaseName,
  entities: [User, Channel, ChannelMember, ChannelJoinRequest, ChannelPin, Message, MessageMention],
  synchronize: configService.nodeEnv === 'development',
  logging: configService.nodeEnv === 'development',
});

