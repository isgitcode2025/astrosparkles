import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp, OtpSchema } from './otp.schema';
import { ConsoleSmsProvider, Msg91SmsProvider, SMS_PROVIDER } from './sms/sms.provider';

@Module({
  imports: [MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('otp.provider') === 'msg91' ? new Msg91SmsProvider(config) : new ConsoleSmsProvider(),
    },
  ],
})
export class AuthModule {}
