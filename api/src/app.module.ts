import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthCommonModule } from './common/auth/auth-common.module';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AdminModule } from './modules/admin/admin.module';
import { AstroModule } from './modules/astro/astro.module';
import { AstrologersModule } from './modules/astrologers/astrologers.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandController } from './modules/brand/brand.controller';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { CalculatorsController } from './modules/calculators/calculators.controller';
import { HealthController } from './modules/health/health.controller';
import { HoroscopeModule } from './modules/horoscope/horoscope.module';
import { PlacesModule } from './modules/places/places.module';
import { ShopModule } from './modules/shop/shop.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { MasterController } from './modules/master/master.controller';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.get<string>('mongo.uri') }),
    }),
    // default rate limit: 120 requests per minute per IP; OTP routes are stricter. Off in automated tests.
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }], skipIf: () => process.env.NODE_ENV === 'test' }),
    AuthCommonModule,
    UsersModule,
    AuthModule,
    AstrologersModule,
    WalletModule,
    ConsultationsModule,
    PlacesModule,
    AstroModule,
    HoroscopeModule,
    ShopModule,
    NewsletterModule,
    GiftsModule,
    AdminModule,
  ],
  controllers: [BrandController, MasterController, HealthController, CalculatorsController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
