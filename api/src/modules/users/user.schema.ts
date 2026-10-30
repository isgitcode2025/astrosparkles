import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum Role {
  User = 'user',
  Astrologer = 'astrologer',
  Admin = 'admin',
  Editor = 'editor', // writes horoscope and other content
}

@Schema({ _id: false })
export class BirthDetails {
  @Prop() dateOfBirth?: string; // YYYY-MM-DD
  @Prop() timeOfBirth?: string; // HH:mm (24h)
  @Prop() place?: string;
  @Prop() latitude?: number;
  @Prop() longitude?: number;
  @Prop() timezone?: string; // IANA, e.g. Asia/Kolkata
}

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, sparse: true, index: true }) phone?: string; // E.164, e.g. +919876543210
  @Prop({ unique: true, sparse: true, lowercase: true, trim: true }) email?: string;
  @Prop({ unique: true, sparse: true }) googleId?: string;
  @Prop({ trim: true }) name?: string;
  @Prop({ enum: ['male', 'female', 'other'] }) gender?: string;
  @Prop() avatarUrl?: string;
  @Prop({ type: BirthDetails, default: {} }) birth: BirthDetails;
  @Prop({ default: 'en', enum: ['en', 'hi'] }) language: string;
  @Prop({ type: [String], enum: Object.values(Role), default: [Role.User] }) roles: Role[];
  /** Wallet balance in paise (integer) to avoid rounding errors. */
  @Prop({ default: 0, min: 0 }) walletBalancePaise: number;
  @Prop({ default: false }) freeConsultationUsed: boolean;
  @Prop({ default: 'active', enum: ['active', 'blocked', 'deleted'] }) status: string;
  @Prop() lastLoginAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
