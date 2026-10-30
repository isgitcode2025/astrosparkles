import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletModule } from '../wallet/wallet.module';
import { AdminShopController, ShopController } from './shop.controller';
import { Counter, CounterSchema, Enrollment, EnrollmentSchema, Product, ProductSchema, ShopOrder, ShopOrderSchema } from './shop.schemas';
import { ShopService } from './shop.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ShopOrder.name, schema: ShopOrderSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    WalletModule,
  ],
  controllers: [ShopController, AdminShopController],
  providers: [ShopService],
})
export class ShopModule {}
