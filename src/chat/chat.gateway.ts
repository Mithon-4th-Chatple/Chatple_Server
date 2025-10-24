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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Message } from '../messages/entities/message.entity';
import { MessageMention } from '../messages/entities/message-mention.entity';
import { ChannelMember } from '../channels/entities/channel-member.entity';
import { User } from '../users/entities/user.entity';

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
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageMention)
    private readonly mentionRepository: Repository<MessageMention>,
    @InjectRepository(ChannelMember)
    private readonly channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    
    try {
      // 토큰 검증
      const token = client.handshake.auth?.token;
      if (!token) {
        console.log('No token provided');
        client.disconnect();
        return;
      }

      // JWT 토큰 검증
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user) {
        console.log('User not found');
        client.disconnect();
        return;
      }

      // 사용자 정보 저장
      client.data.userId = user.id;
      client.data.userRole = user.role;
      client.data.userName = user.name;
      
      console.log(`User authenticated: ${user.name} (${user.role})`);
    } catch (error) {
      console.log('Authentication failed:', error.message);
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
      // 클라이언트에서 이미 저장된 사용자 정보 사용
      const message = {
        id: 'temp-' + Date.now(),
        channelId: data.channelId,
        senderId: client.data.userId,
        senderName: client.data.userName,
        senderRole: client.data.userRole,
        text: data.text,
        createdAt: new Date(),
      };

      // 채널의 모든 사용자에게 메시지 전송 (전송자 포함)
      this.server.in(data.channelId).emit('message.created', {
        message,
      });

      return { success: true, message };
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
      this.server.in(data.channelId).emit('channel.read.synced', {
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
      userName: client.data.userName,
      userRole: client.data.userRole,
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
      userName: client.data.userName,
      userRole: client.data.userRole,
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

