import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminHoroscopeController, HoroscopeController } from './horoscope.controller';
import { Horoscope, HoroscopeSchema } from './horoscope.schema';
import { HoroscopeService } from './horoscope.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Horoscope.name, schema: HoroscopeSchema }])],
  controllers: [HoroscopeController, AdminHoroscopeController],
  providers: [HoroscopeService],
})
export class HoroscopeModule {}
