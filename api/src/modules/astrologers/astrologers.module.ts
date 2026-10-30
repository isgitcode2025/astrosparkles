import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Astrologer, AstrologerSchema } from './astrologer.schema';
import { Follow, FollowSchema } from './follow.schema';
import { AdminAstrologersController, AstrologersController } from './astrologers.controller';
import { AstrologersService } from './astrologers.service';

@Module({
  imports: [MongooseModule.forFeature([
      { name: Astrologer.name, schema: AstrologerSchema },
      { name: Follow.name, schema: FollowSchema },
    ]), UsersModule],
  controllers: [AstrologersController, AdminAstrologersController],
  providers: [AstrologersService],
  exports: [AstrologersService, MongooseModule],
})
export class AstrologersModule {}
