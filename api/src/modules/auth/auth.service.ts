import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { Otp } from './otp.schema';
import { SMS_PROVIDER, SmsProvider } from './sms/sms.provider';

const RESEND_COOLDOWN_MS = 30_000;
const MAX_SENDS_PER_WINDOW = 5;

@Injectable()
export class AuthService {
  private readonly google = new OAuth2Client();

  constructor(
    @InjectModel(Otp.name) private readonly otps: Model<Otp>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hash(phone: string, code: string) {
    return createHash('sha256').update(`${phone}:${code}:${this.config.get('jwt.secret')}`).digest('hex');
  }

  private generateCode(): string {
    const fixed = this.config.get<string>('otp.devFixedCode');
    if (this.sms.name === 'console' && fixed) return fixed;
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  async sendOtp(phone: string) {
    const ttl = this.config.get<number>('otp.ttlSeconds') as number;
    const now = new Date();
    const existing = await this.otps.findOne({ phone });

    if (existing && now.getTime() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException('Please wait 30 seconds before requesting a new OTP', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (existing && existing.sendCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpException('Too many OTP requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateCode();
    await this.sms.sendOtp(phone, code);
    await this.otps.updateOne(
      { phone },
      {
        $set: { codeHash: this.hash(phone, code), attempts: 0, lastSentAt: now, expiresAt: new Date(now.getTime() + ttl * 1000) },
        $inc: { sendCount: 1 },
      },
      { upsert: true },
    );
    return { sent: true, expiresInSeconds: ttl, resendAfterSeconds: RESEND_COOLDOWN_MS / 1000 };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.otps.findOne({ phone });
    if (!otp || otp.expiresAt < new Date()) throw new BadRequestException('OTP expired. Please request a new one.');
    const max = this.config.get<number>('otp.maxAttempts') as number;
    if (otp.attempts >= max) throw new ForbiddenException('Too many wrong attempts. Please request a new OTP.');

    const a = Buffer.from(otp.codeHash);
    const b = Buffer.from(this.hash(phone, code));
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      otp.attempts += 1;
      await otp.save();
      throw new BadRequestException(`Incorrect OTP. ${max - otp.attempts} attempts left.`);
    }

    await otp.deleteOne();
    const { user, isNew } = await this.users.findOrCreateByPhone(phone);
    return this.issueSession(user, isNew);
  }

  async googleLogin(idToken: string) {
    const audience = this.config.get<string[]>('google.clientIds') ?? [];
    if (audience.length === 0) throw new BadRequestException('Google sign-in is not configured');
    let payload;
    try {
      const ticket = await this.google.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google sign-in failed');
    }
    if (!payload?.sub || !payload.email_verified) throw new UnauthorizedException('Google account email is not verified');
    const { user, isNew } = await this.users.findOrCreateByGoogle({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    });
    return this.issueSession(user, isNew);
  }

  private async issueSession(user: UserDocument, isNew: boolean) {
    if (user.status !== 'active') throw new ForbiddenException('This account is not active. Contact support.');
    user.lastLoginAt = new Date();
    await user.save();
    const accessToken = await this.jwt.signAsync({ sub: user.id, roles: user.roles });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.expiresIn'),
      isNewUser: isNew,
      user: UsersService.toPublic(user),
    };
  }
}
