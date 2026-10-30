import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConsultationEvents } from './consultation.events';
import { ConsultationsService } from './consultations.service';

type AuthedSocket = Socket & { data: { userId: string; roles: string[] } };
type ConsultationView = ReturnType<typeof ConsultationsService.toView>;
type MessageView = ReturnType<typeof ConsultationsService.messageView>;

/**
 * Real-time channel for web and mobile.
 *
 * Connect: io(`${API_ORIGIN}/realtime`, { auth: { token: '<accessToken>' } })
 *
 * Server → client events
 *   consultation:updated   ConsultationView (to both user and astrologer)
 *   consultation:warning   { consultationId, secondsLeft, message } (to user)
 *   message:new            MessageView (to everyone in the consultation room)
 *   typing                 { consultationId, sender }
 *   session:ended          { reason } (account blocked; the socket is closed right after)
 *
 * Client → server events (all reply through the ack callback: { ok, data | error })
 *   consultation:join      { consultationId }            → joins the room, returns message history
 *   message:send           { consultationId, text, clientId? }
 *   typing                 { consultationId }
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: true, credentials: true } })
export class ConsultationsGateway implements OnGatewayConnection, OnModuleInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('Realtime');

  constructor(
    private readonly jwt: JwtService,
    private readonly consultations: ConsultationsService,
    private readonly events: ConsultationEvents,
  ) {}

  onModuleInit() {
    this.events.on('consultation.updated', (c: ConsultationView) => {
      this.server?.to([`user:${c.userId}`, `user:${c.astrologerUserId}`]).emit('consultation:updated', c);
    });
    this.events.on('message.created', (m: MessageView) => {
      this.server?.to(`consultation:${m.consultationId}`).emit('message:new', m);
    });
    this.events.on('consultation.warning', (w: { userId: string }) => {
      this.server?.to(`user:${w.userId}`).emit('consultation:warning', w);
    });
    // account blocked or deleted: tell open apps and close their connections at once
    this.events.on('user.signedOut', (u: { userId: string; reason: string }) => {
      const room = this.server?.to(`user:${u.userId}`);
      room?.emit('session:ended', { reason: u.reason });
      room?.disconnectSockets(true);
    });
  }

  async handleConnection(client: AuthedSocket) {
    const token = (client.handshake.auth?.token as string | undefined) ?? (client.handshake.query?.token as string | undefined);
    try {
      if (!token) throw new Error('no token');
      const payload = await this.jwt.verifyAsync<{ sub: string; roles: string[] }>(token);
      // set the identity first: the client may send events as soon as it is connected
      client.data = { userId: payload.sub, roles: payload.roles ?? [] };
      await client.join(`user:${payload.sub}`);
      if (!(await this.consultations.isActiveUser(payload.sub))) {
        client.emit('session:ended', { reason: 'blocked' });
        throw new Error('inactive');
      }
    } catch {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('consultation:join')
  async join(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { consultationId: string }) {
    try {
      const c = await this.consultations.get(client.data.userId, body?.consultationId);
      await client.join(`consultation:${c.id}`);
      const messages = await this.consultations.listMessages(client.data.userId, c.id);
      return { ok: true, data: { consultation: c, messages } };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { consultationId: string; text: string; clientId?: string }) {
    try {
      if (typeof body?.text !== 'string' || body.text.length > 4000) throw new Error('Invalid message');
      const m = await this.consultations.addMessage(client.data.userId, body.consultationId, body.text, body.clientId);
      return { ok: true, data: m };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  @SubscribeMessage('typing')
  async typing(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: { consultationId: string }) {
    if (!body?.consultationId || !client.rooms.has(`consultation:${body.consultationId}`)) return;
    client.to(`consultation:${body.consultationId}`).emit('typing', { consultationId: body.consultationId, userId: client.data.userId });
  }
}
