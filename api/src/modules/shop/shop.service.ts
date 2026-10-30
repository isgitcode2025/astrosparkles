import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { todayIn } from '../places/timezone.util';
import { TxnReason } from '../wallet/wallet.schemas';
import { WalletService } from '../wallet/wallet.service';
import { AdminOrdersQuery, CreateShopOrderDto, UpdatePoojaOrderDto, UpsertProductDto } from './dto/shop.dto';
import {
  Counter,
  Enrollment,
  OrderStatus,
  PoojaStatus,
  Product,
  ProductDocument,
  ProductType,
  ShopOrder,
  ShopOrderDocument,
} from './shop.schemas';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(ShopOrder.name) private readonly orders: Model<ShopOrder>,
    @InjectModel(Enrollment.name) private readonly enrollments: Model<Enrollment>,
    @InjectModel(Counter.name) private readonly counters: Model<Counter>,
    private readonly wallet: WalletService,
  ) {}

  // ---------- catalogue ----------

  async list(type?: ProductType, category?: string) {
    const filter: FilterQuery<Product> = { status: 'published' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    const items = await this.products.find(filter).sort({ sortWeight: -1, createdAt: -1 });
    return items.map((p) => ShopService.card(p));
  }

  async get(slug: string, userId?: string) {
    const p = await this.products.findOne({ slug, status: 'published' });
    if (!p) throw new NotFoundException('Product not found');
    const enrolled = userId && p.type === ProductType.Course ? await this.enrollments.exists({ userId: new Types.ObjectId(userId), productId: p._id }) : null;
    return { ...ShopService.detail(p, Boolean(enrolled)), enrolled: Boolean(enrolled) };
  }

  // ---------- buying ----------

  private async nextOrderNumber() {
    const day = todayIn('Asia/Kolkata').replace(/-/g, '');
    const c = await this.counters.findOneAndUpdate({ key: `order-${day}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
    return `KJ${day.slice(2)}-${String(c.seq).padStart(4, '0')}`;
  }

  /** Pays from the wallet. If the balance is short, the API says how much to add. */
  async buy(userId: string, dto: CreateShopOrderDto) {
    const p = await this.products.findOne({ _id: dto.productId, status: 'published' });
    if (!p) throw new NotFoundException('Product not found');
    if (p.type === ProductType.Pooja && !dto.pooja) throw new BadRequestException('Please give the name for the sankalp');
    if (p.type === ProductType.Course) {
      const already = await this.enrollments.exists({ userId: new Types.ObjectId(userId), productId: p._id });
      if (already) throw new ConflictException('You already have this course');
    }

    const amountPaise = Math.round(p.price * 100);
    const { balance } = await this.wallet.balance(userId);
    if (balance * 100 < amountPaise) {
      throw new BadRequestException(`Wallet balance is ₹${balance}. Please add ₹${Math.ceil(p.price - balance)} more to continue.`);
    }

    const orderNumber = await this.nextOrderNumber();
    const order = await this.orders.create({
      orderNumber,
      userId: new Types.ObjectId(userId),
      productId: p._id,
      type: p.type,
      title: p.title,
      amountPaise,
      paymentMethod: 'wallet',
      status: OrderStatus.Paid,
      pooja: p.type === ProductType.Pooja ? { ...dto.pooja, status: PoojaStatus.Scheduled } : undefined,
    });
    try {
      await this.wallet.debit(userId, amountPaise, TxnReason.Purchase, { description: `${p.title} (${orderNumber})`, refType: 'order', refId: order.id });
    } catch (e) {
      await order.deleteOne();
      throw e;
    }
    if (p.type === ProductType.Course) {
      await this.enrollments.create({ userId: new Types.ObjectId(userId), productId: p._id, orderId: order._id });
    }
    return ShopService.orderView(order);
  }

  async myOrders(userId: string) {
    const list = await this.orders.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(100);
    return list.map((o) => ShopService.orderView(o));
  }

  async myOrder(userId: string, id: string) {
    const o = await this.orders.findById(id);
    if (!o || String(o.userId) !== userId) throw new NotFoundException('Order not found');
    return ShopService.orderView(o);
  }

  // ---------- courses ----------

  async myCourses(userId: string) {
    const list = await this.enrollments.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    const products = await this.products.find({ _id: { $in: list.map((e) => e.productId) } });
    return list
      .map((e) => {
        const p = products.find((x) => String(x._id) === String(e.productId));
        if (!p) return null;
        return { ...ShopService.card(p), completed: e.completedLessonIds.length, totalLessons: p.lessons.length };
      })
      .filter(Boolean);
  }

  async learn(userId: string, slug: string) {
    const p = await this.products.findOne({ slug, type: ProductType.Course });
    if (!p) throw new NotFoundException('Course not found');
    const e = await this.enrollments.findOne({ userId: new Types.ObjectId(userId), productId: p._id });
    if (!e) throw new ForbiddenException('Buy this course to watch the lessons');
    return {
      ...ShopService.card(p),
      lessons: p.lessons.map((l) => ({ id: String(l._id), title: l.title, durationMinutes: l.durationMinutes, videoUrl: l.videoUrl ?? null, notes: l.notes ?? null, completed: e.completedLessonIds.includes(String(l._id)) })),
    };
  }

  async progress(userId: string, slug: string, lessonId: string, completed: boolean) {
    const p = await this.products.findOne({ slug, type: ProductType.Course });
    if (!p || !p.lessons.some((l) => String(l._id) === lessonId)) throw new NotFoundException('Lesson not found');
    const update = completed ? { $addToSet: { completedLessonIds: lessonId } } : { $pull: { completedLessonIds: lessonId } };
    const e = await this.enrollments.findOneAndUpdate({ userId: new Types.ObjectId(userId), productId: p._id }, update, { new: true });
    if (!e) throw new ForbiddenException('Not enrolled');
    return { completed: e.completedLessonIds.length, totalLessons: p.lessons.length };
  }

  // ---------- admin ----------

  async adminList() {
    const items = await this.products.find().sort({ type: 1, sortWeight: -1 });
    return items.map((p) => ({ ...ShopService.detail(p, true), status: p.status }));
  }

  async upsert(dto: UpsertProductDto, id?: string) {
    if (id) {
      const p = await this.products.findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true });
      if (!p) throw new NotFoundException('Product not found');
      return ShopService.detail(p, true);
    }
    if (await this.products.exists({ slug: dto.slug })) throw new ConflictException('Slug already used');
    return ShopService.detail(await this.products.create(dto), true);
  }

  async adminOrders(q: AdminOrdersQuery) {
    const filter: FilterQuery<ShopOrder> = {};
    if (q.type) filter.type = q.type;
    if (q.status) filter.status = q.status;
    if (q.poojaStatus) filter['pooja.status'] = q.poojaStatus;
    const page = q.page ?? 1;
    const [items, total] = await Promise.all([
      this.orders.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 50).limit(50).populate('userId', 'name phone'),
      this.orders.countDocuments(filter),
    ]);
    return {
      items: items.map((o) => ({ ...ShopService.orderView(o), user: o.userId as unknown as { name?: string; phone?: string } })),
      total,
      page,
    };
  }

  async updatePooja(id: string, dto: UpdatePoojaOrderDto) {
    const o = await this.orders.findById(id);
    if (!o || o.type !== ProductType.Pooja || !o.pooja) throw new NotFoundException('Pooja order not found');
    if (dto.status) o.pooja.status = dto.status;
    if (dto.status === PoojaStatus.Performed && !o.pooja.performedAt) o.pooja.performedAt = new Date();
    if (dto.scheduledAt) o.pooja.scheduledAt = new Date(dto.scheduledAt);
    if (dto.recordingUrl) o.pooja.recordingUrl = dto.recordingUrl;
    if (dto.noteToUser !== undefined) o.pooja.noteToUser = dto.noteToUser;
    o.markModified('pooja');
    await o.save();
    return ShopService.orderView(o);
  }

  /** Cancels a paid order and returns the money to the wallet. */
  async refund(id: string) {
    const o = await this.orders.findOneAndUpdate({ _id: id, status: OrderStatus.Paid }, { $set: { status: OrderStatus.Refunded } }, { new: true });
    if (!o) throw new BadRequestException('Only paid orders can be refunded');
    await this.wallet.credit(o.userId, o.amountPaise, TxnReason.Refund, { description: `Refund ${o.orderNumber}`, refType: 'order', refId: o.id });
    if (o.type === ProductType.Course) await this.enrollments.deleteOne({ userId: o.userId, productId: o.productId });
    return ShopService.orderView(o);
  }

  // ---------- views ----------

  static card(p: ProductDocument) {
    return {
      id: p.id as string,
      type: p.type,
      slug: p.slug,
      title: p.title,
      titleHi: p.titleHi ?? null,
      summary: p.summary,
      image: p.images[0] ?? null,
      category: p.category ?? null,
      badge: p.badge || null,
      badgeHi: p.badgeHi || null,
      price: p.price,
      mrp: p.mrp && p.mrp > p.price ? p.mrp : null,
      discountPercent: p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
      durationMinutes: p.durationMinutes ?? null,
      language: p.language ?? null,
      level: p.level ?? null,
      lessonCount: p.lessons.length,
    };
  }

  static detail(p: ProductDocument, includeVideos: boolean) {
    return {
      ...ShopService.card(p),
      description: p.description,
      images: p.images,
      includes: p.includes,
      performedBy: p.performedBy ?? null,
      instructor: p.instructor ?? null,
      lessons: p.lessons.map((l) => ({
        id: String(l._id),
        title: l.title,
        durationMinutes: l.durationMinutes,
        freePreview: l.freePreview,
        videoUrl: includeVideos || l.freePreview ? l.videoUrl ?? null : null,
      })),
    };
  }

  static orderView(o: ShopOrderDocument) {
    return {
      id: o.id as string,
      orderNumber: o.orderNumber,
      type: o.type,
      productId: String(o.productId),
      title: o.title,
      amount: o.amountPaise / 100,
      paymentMethod: o.paymentMethod,
      status: o.status,
      pooja: o.pooja ?? null,
      createdAt: (o as unknown as { createdAt: Date }).createdAt,
    };
  }
}
