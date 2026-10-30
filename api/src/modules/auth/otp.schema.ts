import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** One pending OTP per phone; MongoDB deletes it automatically after expiresAt. */
@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true, unique: true }) phone: string;
  @Prop({ required: true }) codeHash: string;
  @Prop({ default: 0 }) attempts: number;
  @Prop({ default: 1 }) sendCount: number;
  @Prop({ required: true, index: { expires: 0 } }) expiresAt: Date;
  @Prop({ required: true }) lastSentAt: Date;
}

export type OtpDocument = HydratedDocument<Otp>;
export const OtpSchema = SchemaFactory.createForClass(Otp);
