import { BadRequestException, Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Model, Types } from 'mongoose';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Astrologer, AstrologerStatus } from '../astrologers/astrologer.schema';
import { AstrologersModule } from '../astrologers/astrologers.module';
import { GIFT_SLUGS, GIFTS } from '../master/master-data';
import { User } from '../users/user.schema';
import { UsersModule } from '../users/users.module';
import { TxnReason } from '../wallet/wallet.schemas';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { Gift, GiftSchema } from './gift.schema';

export class SendGiftDto {
  @ApiProperty({ example: 'rose', description: 'Gift slug from GET /config/master (gifts)' }) @IsIn(GIFT_SLUGS) gift: string;
}

@Injectable()
export class GiftsService {
  constructor(
    @InjectModel(Gift.name) private readonly gifts: Model<Gift>,
    @InjectModel(Astrologer.name) private readonly astrologers: Model<Astrologer>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly wallet: WalletService,
  ) {}

  /** Pays the gift from the user's wallet; the astrologer earns it minus the platform commission. */
  async send(userId: string, astrologerId: string, slug: string) {
    const item = GIFTS.find((g) => g.slug === slug);
    if (!item) throw new BadRequestException('Unknown gift');
    if (!Types.ObjectId.isValid(astrologerId)) throw new NotFoundException('Astrologer not found');
    const astro = await this.astrologers.findOne({ _id: astrologerId, status: AstrologerStatus.Approved });
    if (!astro) throw new NotFoundException('Astrologer not found');
    if (String(astro.userId) === userId) throw new BadRequestException('You cannot send a gift to yourself');

    const amountPaise = item.price * 100;
    const user = await this.users.findById(userId).select('walletBalancePaise name');
    if (!user) throw new NotFoundException('User not found');
    if (user.walletBalancePaise < amountPaise) {
      const short = Math.ceil((amountPaise - user.walletBalancePaise) / 100);
      throw new BadRequestException(`Wallet balance is ₹${Math.floor(user.walletBalancePaise / 100)}. Please add ₹${short} more to send this gift.`);
    }
    const giftId = new Types.ObjectId();
    await this.wallet.debit(userId, amountPaise, TxnReason.Gift, {
      description: `${item.en} gift to ${astro.displayName}`,
      refType: 'gift',
      refId: String(giftId),
    });
    const commissionPercent = astro.commissionPercent;
    const g = await this.gifts.create({
      _id: giftId,
      userId: new Types.ObjectId(userId),
      astrologerId: astro._id,
      astrologerUserId: astro.userId,
      gift: item.slug,
      amountPaise,
      commissionPercent,
      astrologerEarningPaise: Math.floor((amountPaise * (100 - commissionPercent)) / 100),
      userName: user.name,
    });
    const balance = await this.wallet.balance(userId);
    return { id: g.id as string, gift: item, amount: item.price, astrologerName: astro.displayName, balance: balance.balance };
  }
}

@ApiTags('Gifts')
@Controller()
export class GiftsController {
  constructor(private readonly gifts: GiftsService) {}

  @Get('gifts')
  @ApiOperation({ summary: 'Gift catalogue (same as gifts in /config/master)' })
  catalogue() {
    return GIFTS;
  }

  @Post('astrologers/:id/gifts')
  @Auth()
  @ApiOperation({ summary: 'Send a gift to an astrologer, paid from the wallet' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendGiftDto) {
    return this.gifts.send(user.id, id, dto.gift);
  }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Gift.name, schema: GiftSchema }]), AstrologersModule, UsersModule, WalletModule],
  controllers: [GiftsController],
  providers: [GiftsService],
})
export class GiftsModule {}
