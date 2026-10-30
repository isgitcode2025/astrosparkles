import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { PaymentsWebhookController, WalletController } from './wallet.controller';
import { PaymentOrder, PaymentOrderSchema, WalletTransaction, WalletTransactionSchema } from './wallet.schemas';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
    ]),
  ],
  controllers: [WalletController, PaymentsWebhookController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
