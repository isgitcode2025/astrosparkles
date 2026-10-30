import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/** A user following an astrologer (to see them first and get "online" alerts later). */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Astrologer', required: true, index: true }) astrologerId: Types.ObjectId;
}
export const FollowSchema = SchemaFactory.createForClass(Follow);
FollowSchema.index({ userId: 1, astrologerId: 1 }, { unique: true });
