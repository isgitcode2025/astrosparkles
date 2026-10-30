import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum BookingStatus {
  Confirmed = 'confirmed', // paid, waiting for the slot
  Started = 'started', // session running
  Completed = 'completed',
  Cancelled = 'cancelled', // refunded
  Expired = 'expired', // nobody started it in time, refunded
}

/** A prepaid scheduled session in an astrologer's slot. Amounts in paise. */
@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Astrologer', required: true, index: true }) astrologerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) astrologerUserId: Types.ObjectId;
  @Prop({ required: true, enum: ['chat'] }) mode: 'chat';
  @Prop({ required: true }) start: Date;
  @Prop({ required: true }) end: Date;
  @Prop({ required: true }) minutes: number;
  @Prop({ required: true }) ratePerMinPaise: number;
  @Prop({ required: true }) amountPaise: number;
  @Prop({ required: true }) commissionPercent: number;
  @Prop({ default: BookingStatus.Confirmed, enum: Object.values(BookingStatus), index: true }) status: BookingStatus;
  /** true while the slot is taken (confirmed / started / completed); a unique index keeps one booking per slot. */
  @Prop({ default: true }) holdsSlot: boolean;
  @Prop() userName?: string;
  @Prop() astrologerName: string;
  @Prop({ maxlength: 300 }) topic?: string;
  @Prop({ type: Types.ObjectId, ref: 'Consultation' }) consultationId?: Types.ObjectId;
  @Prop() cancelledBy?: 'user' | 'astrologer' | 'system';
  @Prop() refundedPaise?: number;
}
export type BookingDocument = HydratedDocument<Booking>;
export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ astrologerId: 1, start: 1 }, { unique: true, partialFilterExpression: { holdsSlot: true } });
BookingSchema.index({ status: 1, end: 1 });
