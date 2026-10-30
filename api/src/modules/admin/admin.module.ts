import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Astrologer, AstrologerSchema } from '../astrologers/astrologer.schema';
import { Booking, BookingSchema } from '../consultations/booking.schema';
import { Consultation, ConsultationSchema } from '../consultations/consultation.schemas';
import { ConsultationsModule } from '../consultations/consultations.module';
import { Gift, GiftSchema } from '../gifts/gift.schema';
import { Subscriber, SubscriberSchema } from '../newsletter/newsletter.module';
import { ShopOrder, ShopOrderSchema } from '../shop/shop.schemas';
import { User, UserSchema } from '../users/user.schema';
import { PaymentOrder, PaymentOrderSchema, WalletTransaction, WalletTransactionSchema } from '../wallet/wallet.schemas';
import { WalletModule } from '../wallet/wallet.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Astrologer.name, schema: AstrologerSchema },
      { name: Consultation.name, schema: ConsultationSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Gift.name, schema: GiftSchema },
      { name: ShopOrder.name, schema: ShopOrderSchema },
      { name: Subscriber.name, schema: SubscriberSchema },
    ]),
    WalletModule,
    ConsultationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
