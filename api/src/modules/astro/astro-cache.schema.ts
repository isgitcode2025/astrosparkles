import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

/** Cached provider responses; MongoDB removes them after expiresAt. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AstroCache {
  @Prop({ required: true, unique: true }) key: string;
  @Prop({ required: true }) path: string;
  @Prop({ type: MongooseSchema.Types.Mixed }) output: unknown;
  @Prop({ required: true, index: { expires: 0 } }) expiresAt: Date;
}
export const AstroCacheSchema = SchemaFactory.createForClass(AstroCache);
