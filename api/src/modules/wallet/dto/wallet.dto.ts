import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRechargeOrderDto {
  @ApiProperty({ example: 500, description: 'Recharge amount in rupees (GST is added on top)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_PQ1x2y3z' }) @IsString() orderId: string;
  @ApiProperty({ example: 'pay_PQ1x2y3z' }) @IsString() paymentId: string;
  @ApiProperty({ description: 'razorpay_signature from Checkout. In mock mode send "mock".' }) @IsString() signature: string;
}

export class CancelPaymentDto {
  @ApiProperty() @IsString() orderId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class TransactionsQuery {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
