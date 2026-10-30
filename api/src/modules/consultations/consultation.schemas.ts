import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ConsultMode {
  Chat = 'chat',
  Call = 'call',
  Video = 'video',
}

export enum ConsultStatus {
  Requested = 'requested', // waiting for the astrologer to accept
  Active = 'active',
  Completed = 'completed',
  Rejected = 'rejected', // astrologer declined
  Missed = 'missed', // astrologer did not respond in time
  Cancelled = 'cancelled', // user cancelled before it started
}

export const OPEN_STATUSES = [ConsultStatus.Requested, ConsultStatus.Active];

@Schema({ _id: false })
export class Review {
  @Prop({ min: 1, max: 5 }) rating: number;
  @Prop({ maxlength: 1000 }) comment?: string;
  @Prop() createdAt: Date;
  /** Astrologer's public reply, shown under the review. */
  @Prop({ maxlength: 500 }) reply?: string;
  @Prop() repliedAt?: Date;
  /** Hidden by an admin (abusive or off-topic). Hidden reviews are left out of ratings and public lists. */
  @Prop() hidden?: boolean;
}

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Astrologer', required: true, index: true }) astrologerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) astrologerUserId: Types.ObjectId;
  @Prop({ required: true, enum: Object.values(ConsultMode) }) mode: ConsultMode;
  @Prop({ required: true, enum: Object.values(ConsultStatus), index: true }) status: ConsultStatus;

  /** Snapshot of names so history stays readable if profiles change. */
  @Prop() userName?: string;
  @Prop() astrologerName: string;

  @Prop({ required: true }) ratePerMinPaise: number;
  @Prop({ default: 0 }) freeMinutes: number;
  /** Longest the session can run with the user's balance at start (free + paid minutes). */
  @Prop({ required: true }) maxMinutes: number;
  @Prop({ default: 0 }) commissionPercent: number;

  @Prop({ required: true }) requestedAt: Date;
  @Prop() startedAt?: Date;
  @Prop() endedAt?: Date;
  @Prop() endReason?: string; // user_ended | astrologer_ended | balance_exhausted | ...
  @Prop() endedBy?: string; // 'user' | 'astrologer' | 'system'

  @Prop({ default: 0 }) billedMinutes: number;
  @Prop({ default: 0 }) amountPaise: number; // debited from the user's wallet
  @Prop({ default: 0 }) astrologerEarningPaise: number;

  /** Birth details the user shares with the astrologer at the start. */
  @Prop({ type: Object }) intake?: Record<string, unknown>;
  @Prop({ type: Review }) review?: Review;

  /** Set for scheduled sessions: already paid when booked, so ending does not bill the wallet. */
  @Prop({ type: Types.ObjectId, ref: 'Booking' }) bookingId?: Types.ObjectId;
  @Prop({ default: false }) prepaid: boolean;

  /** For call/video: provider channel name (Agora). */
  @Prop() channelName?: string;
}
export type ConsultationDocument = HydratedDocument<Consultation>;
export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
ConsultationSchema.index({ userId: 1, createdAt: -1 });
ConsultationSchema.index({ astrologerUserId: 1, createdAt: -1 });
ConsultationSchema.index({ status: 1, requestedAt: 1 });

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Consultation', required: true, index: true }) consultationId: Types.ObjectId;
  @Prop({ required: true, enum: ['user', 'astrologer', 'system'] }) sender: 'user' | 'astrologer' | 'system';
  @Prop({ required: true, maxlength: 4000 }) text: string;
  @Prop() clientId?: string; // lets the sender match its optimistic message
}
export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ consultationId: 1, createdAt: 1 });
