import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PERIODS, SIGN_SLUGS } from './signs';

@Schema({ _id: false })
export class AreaScores {
  @Prop({ min: 1, max: 5 }) love?: number;
  @Prop({ min: 1, max: 5 }) career?: number;
  @Prop({ min: 1, max: 5 }) money?: number;
  @Prop({ min: 1, max: 5 }) health?: number;
}

/** One horoscope text written by the content team for a sign, period and language. */
@Schema({ timestamps: true })
export class Horoscope {
  @Prop({ required: true, enum: SIGN_SLUGS }) sign: string;
  @Prop({ required: true, enum: PERIODS }) period: string;
  @Prop({ required: true }) periodKey: string; // 2026-10-24 | 2026-W43 | 2026-10
  @Prop({ required: true, enum: ['en', 'hi'] }) lang: string;
  @Prop({ required: true, maxlength: 6000 }) text: string;
  @Prop() luckyNumber?: string;
  @Prop() luckyColor?: string;
  @Prop() mantra?: string;
  @Prop() remedy?: string;
  @Prop({ type: AreaScores }) scores?: AreaScores;
  @Prop({ default: 'published', enum: ['draft', 'published'] }) status: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) updatedBy?: Types.ObjectId;
}
export type HoroscopeDocument = HydratedDocument<Horoscope>;
export const HoroscopeSchema = SchemaFactory.createForClass(Horoscope);
HoroscopeSchema.index({ sign: 1, period: 1, periodKey: 1, lang: 1 }, { unique: true });
