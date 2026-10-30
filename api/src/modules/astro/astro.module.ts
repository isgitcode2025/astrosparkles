import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlacesModule } from '../places/places.module';
import { AstroCache, AstroCacheSchema } from './astro-cache.schema';
import { AstroController } from './astro.controller';
import { AstroService } from './astro.service';
import { NavamshaClient } from './navamsha.client';

@Module({
  imports: [MongooseModule.forFeature([{ name: AstroCache.name, schema: AstroCacheSchema }]), PlacesModule],
  controllers: [AstroController],
  providers: [AstroService, NavamshaClient],
  exports: [AstroService],
})
export class AstroModule {}
