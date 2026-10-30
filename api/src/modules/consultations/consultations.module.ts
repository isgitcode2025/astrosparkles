import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AstrologersModule } from '../astrologers/astrologers.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { Gift, GiftSchema } from '../gifts/gift.schema';
import { Booking, BookingSchema } from './booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ChatMessage, ChatMessageSchema, Consultation, ConsultationSchema } from './consultation.schemas';
import { ConsultationEvents } from './consultation.events';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsGateway } from './consultations.gateway';
import { ConsultationsService } from './consultations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consultation.name, schema: ConsultationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Gift.name, schema: GiftSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    UsersModule,
    AstrologersModule,
    WalletModule,
  ],
  controllers: [ConsultationsController, BookingsController],
  providers: [ConsultationsService, BookingsService, ConsultationEvents, ConsultationsGateway],
  exports: [ConsultationsService, ConsultationEvents],
})
export class ConsultationsModule {}
