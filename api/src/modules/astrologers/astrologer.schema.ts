import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AstrologerStatus {
  Pending = 'pending', // applied, under review
  Approved = 'approved', // live on the platform
  Rejected = 'rejected',
  Suspended = 'suspended',
}

export enum Presence {
  Online = 'online',
  Busy = 'busy', // in a consultation
  Offline = 'offline',
}

@Schema({ _id: false })
export class Rates {
  /** Per-minute prices in rupees. 0 = mode not offered. */
  @Prop({ default: 0, min: 0 }) chat: number;
  @Prop({ default: 0, min: 0 }) call: number;
  @Prop({ default: 0, min: 0 }) video: number;
  /** Optional promotional per-minute price shown with the regular one struck through. */
  @Prop({ min: 0 }) chatOffer?: number;
  @Prop({ min: 0 }) callOffer?: number;
  @Prop({ min: 0 }) videoOffer?: number;
}

@Schema({ _id: false })
export class ScheduleDay {
  /** 0 = Sunday … 6 = Saturday */
  @Prop({ required: true, min: 0, max: 6 }) day: number;
  /** Local time in the astrologer's zone, "HH:mm". */
  @Prop({ required: true }) start: string;
  @Prop({ required: true }) end: string;
}

/** Weekly hours for scheduled (pre-booked) sessions. */
@Schema({ _id: false })
export class Schedule {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ default: 30, enum: [15, 30, 45, 60] }) slotMinutes: number;
  @Prop({ default: 'Asia/Kolkata' }) timezone: string;
  @Prop({ type: [ScheduleDay], default: [] }) days: ScheduleDay[];
}

@Schema({ timestamps: true })
export class Astrologer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId;
  @Prop({ required: true, trim: true }) displayName: string;
  @Prop({ required: true, unique: true, index: true }) slug: string;
  @Prop({ unique: true, sparse: true }) code?: string; // public ID, e.g. KJ1024
  @Prop() avatarUrl?: string;
  @Prop({ default: '' }) bioEn: string;
  @Prop({ default: '' }) bioHi: string;
  @Prop({ enum: ['male', 'female', 'other'] }) gender?: string;
  @Prop({ type: [String], default: [] }) expertise: string[];
  @Prop({ type: [String], default: [] }) concerns: string[];
  @Prop({ type: [String], default: [] }) languages: string[];
  @Prop({ type: [String], default: [] }) qualifications: string[];
  @Prop({ default: 0, min: 0 }) experienceYears: number;
  @Prop({ type: Rates, default: {} }) rates: Rates;
  /** Platform commission percentage taken from consultation earnings. */
  @Prop({ default: 50, min: 0, max: 100 }) commissionPercent: number;
  @Prop({ type: [String], default: [] }) badges: string[]; // e.g. 'new', 'top-rated', 'celebrity'
  @Prop({ default: AstrologerStatus.Pending, enum: Object.values(AstrologerStatus), index: true }) status: AstrologerStatus;
  @Prop({ default: Presence.Offline, enum: Object.values(Presence), index: true }) presence: Presence;
  @Prop() lastOnlineAt?: Date;
  @Prop({ default: 0 }) ratingAverage: number;
  @Prop({ default: 0 }) ratingCount: number;
  @Prop({ default: 0 }) consultationCount: number;
  @Prop({ default: 0 }) followerCount: number;
  @Prop({ default: 100 }) sortWeight: number; // admin can pin astrologers higher
  @Prop() rejectionReason?: string;
  @Prop({ type: Schedule, default: {} }) schedule: Schedule;
}

export type AstrologerDocument = HydratedDocument<Astrologer>;
export const AstrologerSchema = SchemaFactory.createForClass(Astrologer);
AstrologerSchema.index({ status: 1, presence: 1, sortWeight: -1, ratingAverage: -1 });
