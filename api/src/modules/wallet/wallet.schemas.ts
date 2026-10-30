import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum TxnReason {
  Recharge = 'recharge',
  Bonus = 'bonus',
  Consultation = 'consultation',
  Refund = 'refund',
  Purchase = 'purchase',
  Adjustment = 'adjustment',
  Gift = 'gift',
}

/** Immutable wallet ledger. Every balance change writes one row. Amounts in paise. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ required: true, enum: ['credit', 'debit'] }) type: 'credit' | 'debit';
  @Prop({ required: true, min: 1 }) amountPaise: number;
  @Prop({ required: true, min: 0 }) balanceAfterPaise: number;
  @Prop({ required: true, enum: Object.values(TxnReason) }) reason: TxnReason;
  @Prop() description?: string;
  @Prop() refType?: string; // 'payment_order' | 'consultation' | 'order'
  @Prop() refId?: string;
}
export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;
export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export enum PaymentStatus {
  Created = 'created',
  Paid = 'paid',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/** One Razorpay order per recharge attempt. */
@Schema({ timestamps: true })
export class PaymentOrder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ required: true, unique: true }) gatewayOrderId: string;
  @Prop() gatewayPaymentId?: string;
  @Prop({ default: 'razorpay' }) gateway: string;
  @Prop({ default: false }) mock: boolean;
  @Prop({ default: 'wallet_recharge' }) purpose: string;
  @Prop({ required: true }) rechargePaise: number; // amount the user chose
  @Prop({ default: 0 }) bonusPaise: number;
  @Prop({ default: 0 }) gstPaise: number;
  @Prop({ required: true }) totalPaise: number; // amount charged = recharge + GST
  @Prop({ default: 'INR' }) currency: string;
  @Prop({ default: PaymentStatus.Created, enum: Object.values(PaymentStatus), index: true }) status: PaymentStatus;
  @Prop() paidAt?: Date;
  @Prop() failureReason?: string;
}
export type PaymentOrderDocument = HydratedDocument<PaymentOrder>;
export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);
