import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/** A gift sent from a user's wallet to an astrologer. Amounts in paise. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Gift {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Astrologer', required: true, index: true }) astrologerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) astrologerUserId: Types.ObjectId;
  @Prop({ required: true }) gift: string;
  @Prop({ required: true }) amountPaise: number;
  @Prop({ required: true }) commissionPercent: number;
  @Prop({ required: true }) astrologerEarningPaise: number;
  @Prop() userName?: string;
}
export type GiftDocument = HydratedDocument<Gift>;
export const GiftSchema = SchemaFactory.createForClass(Gift);
GiftSchema.index({ astrologerUserId: 1, createdAt: -1 });
