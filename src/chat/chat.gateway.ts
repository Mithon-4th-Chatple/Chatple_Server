import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';
import { MessageMention } from '../messages/entities/message-mention.entity';
import { ChannelMember } from '../channels/entities/channel-member.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageMention)
    private mentionRepository: Repository<MessageMention>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.user = payload;
      
      console.log(`Client connected: ${client.id}, userId: ${payload.sub}`);
    } catch (error) {
      console.error('WebSocket auth error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    this.typingUsers.forEach((users, channelId) => {
      if (users.has(client.data.userId)) {
        users.delete(client.data.userId);
        this.server.to(channelId).emit('typing', {
          channelId,
          userId: client.data.userId,
          isTyping: false,
        });
      }
    });
  }

  @SubscribeMessage('channel.join')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(data.channelId);
    console.log(`User ${client.data.userId} joined channel ${data.channelId}`);
    return { success: true };
  }

  @SubscribeMessage('channel.leave')
  async handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(data.channelId);
    console.log(`User ${client.data.userId} left channel ${data.channelId}`);
    return { success: true };
  }

  @SubscribeMessage('message.send')
  async handleSendMessage(
    @MessageBody()
    data: {
      channelId: string;
      text: string;
      attachments?: any[];
      mentions?: string[];
      idempotencyKey?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = this.messageRepository.create({
        channelId: data.channelId,
        senderId: client.data.userId,
        text: data.text,
        attachments: data.attachments,
      });

      const savedMessage = await this.messageRepository.save(message);

      if (data.mentions && data.mentions.length > 0) {
        const mentions = data.mentions.map((userId) =>
          this.mentionRepository.create({
            messageId: savedMessage.id,
            targetUserId: userId,
          }),
        );
        await this.mentionRepository.save(mentions);
      }

      this.server.to(data.channelId).emit('message.created', {
        message: savedMessage,
      });

      return { success: true, message: savedMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('channel.read')
  async handleMarkAsRead(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.channelMemberRepository.update(
        {
          channelId: data.channelId,
          userId: client.data.userId,
        },
        {
          lastReadAt: new Date(),
        },
      );

      this.server.to(data.channelId).emit('channel.read.synced', {
        channelId: data.channelId,
        userId: client.data.userId,
        lastReadAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing.start')
  async handleTypingStart(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.typingUsers.has(data.channelId)) {
      this.typingUsers.set(data.channelId, new Set());
    }
    
    const users = this.typingUsers.get(data.channelId);
    if (users) {
      users.add(client.data.userId);
    }

    client.to(data.channelId).emit('typing', {
      channelId: data.channelId,
      userId: client.data.userId,
      isTyping: true,
    });

    return { success: true };
  }

  @SubscribeMessage('typing.stop')
  async handleTypingStop(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const users = this.typingUsers.get(data.channelId);
    if (users) {
      users.delete(client.data.userId);
    }

    client.to(data.channelId).emit('typing', {
      channelId: data.channelId,
      userId: client.data.userId,
      isTyping: false,
    });

    return { success: true };
  }

  emitMessageUpdated(channelId: string, messageId: string, text: string) {
    this.server.to(channelId).emit('message.updated', {
      id: messageId,
      text,
      editedAt: new Date(),
    });
  }

  emitMessageDeleted(channelId: string, messageId: string) {
    this.server.to(channelId).emit('message.deleted', {
      id: messageId,
    });
  }

  emitPinUpdated(channelId: string, pins: any[]) {
    this.server.to(channelId).emit('pin.updated', {
      channelId,
      pins,
    });
  }

  emitJoinRequestCreated(channelId: string, request: any) {
    this.server.to(channelId).emit('join.request.created', {
      request,
    });
  }

  emitJoinRequestUpdated(channelId: string, request: any) {
    this.server.to(channelId).emit('join.request.updated', {
      request,
    });
  }
}

