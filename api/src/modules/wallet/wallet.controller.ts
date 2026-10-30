import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RawBodyRequest } from '@nestjs/common/interfaces';
import { Request } from 'express';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { CancelPaymentDto, CreateRechargeOrderDto, TransactionsQuery, VerifyPaymentDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('recharge-settings')
  @ApiOperation({ summary: 'Recharge packs with bonus and GST, min/max amount, Razorpay key id (public)' })
  settings() {
    return this.wallet.rechargeSettings();
  }

  @Get('quote')
  @ApiOperation({ summary: 'Price breakdown for a custom recharge amount (public)' })
  quote(@Query() dto: CreateRechargeOrderDto) {
    return this.wallet.quote(dto.amount);
  }

  @Get('balance')
  @Auth()
  @ApiOperation({ summary: 'My wallet balance' })
  balance(@CurrentUser() user: AuthUser) {
    return this.wallet.balance(user.id);
  }

  @Get('transactions')
  @Auth()
  @ApiOperation({ summary: 'My wallet transactions, newest first' })
  transactions(@CurrentUser() user: AuthUser, @Query() q: TransactionsQuery) {
    return this.wallet.transactions(user.id, q.page, q.limit);
  }

  @Post('create-order')
  @Auth()
  @ApiOperation({
    summary: 'Step 1 of recharge: create a Razorpay order',
    description: 'Open Razorpay Checkout with the returned orderId and razorpayKeyId. In mock mode skip Checkout and call verify-payment with signature "mock".',
  })
  createOrder(@CurrentUser() user: AuthUser, @Body() dto: CreateRechargeOrderDto) {
    return this.wallet.createRechargeOrder(user.id, dto.amount);
  }

  @Post('verify-payment')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Step 2 of recharge: verify the Checkout result and credit the wallet' })
  verify(@CurrentUser() user: AuthUser, @Body() dto: VerifyPaymentDto) {
    return this.wallet.verifyPayment(user.id, dto.orderId, dto.paymentId, dto.signature);
  }

  @Post('payment-cancelled')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Tell the server the user closed Checkout without paying' })
  cancel(@CurrentUser() user: AuthUser, @Body() dto: CancelPaymentDto) {
    return this.wallet.cancelPayment(user.id, dto.orderId, dto.reason);
  }
}

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly wallet: WalletService) {}

  @Post('razorpay/webhook')
  @HttpCode(200)
  @SkipThrottle()
  @ApiExcludeEndpoint()
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature?: string) {
    return this.wallet.handleWebhook(req.rawBody, signature);
  }
}
