import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Model, Types } from 'mongoose';
import Razorpay from 'razorpay';
import { User } from '../users/user.schema';
import { PaymentOrder, PaymentOrderDocument, PaymentStatus, TxnReason, WalletTransaction } from './wallet.schemas';

export interface RechargePack {
  amount: number;
  bonusPercent: number;
  bonus: number;
  gst: number;
  total: number;
}

const toPaise = (rupees: number) => Math.round(rupees * 100);
const toRupees = (paise: number) => paise / 100;

@Injectable()
export class WalletService {
  private readonly logger = new Logger('Wallet');
  private readonly razorpay?: Razorpay;

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(WalletTransaction.name) private readonly txns: Model<WalletTransaction>,
    @InjectModel(PaymentOrder.name) private readonly orders: Model<PaymentOrder>,
    private readonly config: ConfigService,
  ) {
    const keyId = config.get<string>('razorpay.keyId');
    const keySecret = config.get<string>('razorpay.keySecret');
    if (keyId && keySecret) this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    else this.logger.warn('Razorpay keys not set: wallet recharges run in MOCK mode (no real payment).');
  }

  get isMock() {
    return !this.razorpay;
  }

  // ---------- quotes ----------

  private bonusPercentFor(amount: number): number {
    const packs = this.parsePacks();
    // bonus of the largest pack the amount qualifies for
    return packs.filter((p) => amount >= p.amount).reduce((best, p) => Math.max(best, p.bonusPercent), 0);
  }

  private parsePacks() {
    return (this.config.get<string>('wallet.packs') ?? '')
      .split(',')
      .map((s) => s.split(':').map(Number))
      .filter(([a]) => a > 0)
      .map(([amount, bonusPercent]) => ({ amount, bonusPercent: bonusPercent || 0 }));
  }

  quote(amount: number): RechargePack {
    const gstPercent = this.config.get<number>('wallet.gstPercent') ?? 0;
    const bonusPercent = this.bonusPercentFor(amount);
    const gst = Math.round(amount * gstPercent) / 100;
    return {
      amount,
      bonusPercent,
      bonus: Math.floor((amount * bonusPercent) / 100),
      gst,
      total: Math.round((amount + gst) * 100) / 100,
    };
  }

  rechargeSettings() {
    return {
      currency: 'INR',
      gstPercent: this.config.get<number>('wallet.gstPercent'),
      minRecharge: this.config.get<number>('wallet.minRecharge'),
      maxRecharge: this.config.get<number>('wallet.maxRecharge'),
      packs: this.parsePacks().map((p) => this.quote(p.amount)),
      razorpayKeyId: this.config.get<string>('razorpay.keyId') || null,
      mockMode: this.isMock,
    };
  }

  // ---------- balance & history ----------

  async balance(userId: string) {
    const user = await this.users.findById(userId).select('walletBalancePaise freeConsultationUsed').lean();
    if (!user) throw new NotFoundException('User not found');
    return { balance: toRupees(user.walletBalancePaise), currency: 'INR', freeConsultationAvailable: !user.freeConsultationUsed };
  }

  async transactions(userId: string, page = 1, limit = 20) {
    const filter = { userId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.txns.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.txns.countDocuments(filter),
    ]);
    return {
      items: items.map((t) => ({
        id: String(t._id),
        type: t.type,
        amount: toRupees(t.amountPaise),
        balanceAfter: toRupees(t.balanceAfterPaise),
        reason: t.reason,
        description: t.description,
        refType: t.refType,
        refId: t.refId,
        createdAt: (t as unknown as { createdAt: Date }).createdAt,
      })),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  // ---------- ledger primitives (also used by consultations and shop) ----------

  async credit(userId: string | Types.ObjectId, amountPaise: number, reason: TxnReason, meta: { description?: string; refType?: string; refId?: string } = {}) {
    if (amountPaise <= 0) return null;
    const user = await this.users.findByIdAndUpdate(userId, { $inc: { walletBalancePaise: amountPaise } }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return this.txns.create({ userId: user._id, type: 'credit', amountPaise, balanceAfterPaise: user.walletBalancePaise, reason, ...meta });
  }

  /** Atomic debit: fails if the balance is insufficient. */
  async debit(userId: string | Types.ObjectId, amountPaise: number, reason: TxnReason, meta: { description?: string; refType?: string; refId?: string } = {}) {
    if (amountPaise <= 0) return null;
    const user = await this.users.findOneAndUpdate(
      { _id: userId, walletBalancePaise: { $gte: amountPaise } },
      { $inc: { walletBalancePaise: -amountPaise } },
      { new: true },
    );
    if (!user) throw new BadRequestException('Insufficient wallet balance');
    return this.txns.create({ userId: user._id, type: 'debit', amountPaise, balanceAfterPaise: user.walletBalancePaise, reason, ...meta });
  }

  // ---------- Razorpay recharge flow ----------

  async createRechargeOrder(userId: string, amount: number) {
    const min = this.config.get<number>('wallet.minRecharge') as number;
    const max = this.config.get<number>('wallet.maxRecharge') as number;
    if (amount < min || amount > max) throw new BadRequestException(`Recharge amount must be between ₹${min} and ₹${max}`);

    const q = this.quote(amount);
    const totalPaise = toPaise(q.total);
    const receipt = `rch_${randomBytes(6).toString('hex')}`;

    let gatewayOrderId: string;
    if (this.razorpay) {
      const order = await this.razorpay.orders.create({ amount: totalPaise, currency: 'INR', receipt, notes: { userId, purpose: 'wallet_recharge' } });
      gatewayOrderId = order.id;
    } else {
      gatewayOrderId = `order_mock_${randomBytes(8).toString('hex')}`;
    }

    await this.orders.create({
      userId: new Types.ObjectId(userId),
      gatewayOrderId,
      mock: this.isMock,
      rechargePaise: toPaise(q.amount),
      bonusPaise: toPaise(q.bonus),
      gstPaise: toPaise(q.gst),
      totalPaise,
    });

    return {
      orderId: gatewayOrderId,
      razorpayKeyId: this.config.get<string>('razorpay.keyId') || null,
      amountPaise: totalPaise,
      currency: 'INR',
      breakdown: q,
      mockMode: this.isMock,
    };
  }

  private signatureValid(orderId: string, paymentId: string, signature: string) {
    const secret = this.config.get<string>('razorpay.keySecret') as string;
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async verifyPayment(userId: string, orderId: string, paymentId: string, signature: string) {
    const order = await this.orders.findOne({ gatewayOrderId: orderId, userId: new Types.ObjectId(userId) });
    if (!order) throw new NotFoundException('Payment order not found');
    if (order.status === PaymentStatus.Paid) return this.verifyResult(userId, order, true);

    const ok = order.mock ? signature === 'mock' : this.signatureValid(orderId, paymentId, signature);
    if (!ok) {
      order.status = PaymentStatus.Failed;
      order.failureReason = 'Signature mismatch';
      await order.save();
      throw new UnauthorizedException('Payment verification failed');
    }
    await this.markPaidAndCredit(orderId, paymentId);
    return this.verifyResult(userId, order, false);
  }

  private async verifyResult(userId: string, order: PaymentOrderDocument, alreadyProcessed: boolean) {
    const { balance } = await this.balance(userId);
    return {
      status: 'paid',
      credited: toRupees(order.rechargePaise),
      bonus: toRupees(order.bonusPaise),
      balance,
      alreadyProcessed,
    };
  }

  async cancelPayment(userId: string, orderId: string, reason?: string) {
    await this.orders.updateOne(
      { gatewayOrderId: orderId, userId: new Types.ObjectId(userId), status: PaymentStatus.Created },
      { $set: { status: PaymentStatus.Cancelled, failureReason: reason ?? 'Cancelled by user' } },
    );
    return { status: 'cancelled' };
  }

  /**
   * Idempotent: the status change created → paid happens once, so the wallet is credited once
   * even if the app's verify call and the Razorpay webhook both arrive.
   */
  async markPaidAndCredit(orderId: string, paymentId?: string) {
    const order = await this.orders.findOneAndUpdate(
      { gatewayOrderId: orderId, status: { $in: [PaymentStatus.Created, PaymentStatus.Failed, PaymentStatus.Cancelled] } },
      { $set: { status: PaymentStatus.Paid, gatewayPaymentId: paymentId, paidAt: new Date(), failureReason: undefined } },
      { new: true },
    );
    if (!order) return false; // already paid or unknown
    const meta = { refType: 'payment_order', refId: order.gatewayOrderId };
    await this.credit(order.userId, order.rechargePaise, TxnReason.Recharge, { ...meta, description: `Wallet recharge ₹${toRupees(order.rechargePaise)}` });
    await this.credit(order.userId, order.bonusPaise, TxnReason.Bonus, { ...meta, description: 'Recharge bonus' });
    return true;
  }

  /** Razorpay webhook (payment.captured / order.paid). */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = this.config.get<string>('razorpay.webhookSecret');
    if (!secret || !rawBody || !signature) throw new UnauthorizedException('Webhook not configured or unsigned');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Invalid webhook signature');

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) await this.markPaidAndCredit(payment.order_id, payment.id);
    }
    return { received: true };
  }
}
