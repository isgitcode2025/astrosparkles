import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ProductType {
  Pooja = 'pooja',
  Course = 'course',
}

@Schema({ _id: true })
export class Lesson {
  _id: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ default: 0 }) durationMinutes: number;
  /** YouTube/Vimeo (unlisted) or MP4 link. Only sent to enrolled users, except free previews. */
  @Prop() videoUrl?: string;
  @Prop() notes?: string;
  @Prop({ default: false }) freePreview: boolean;
}
export const LessonSchema = SchemaFactory.createForClass(Lesson);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, enum: Object.values(ProductType), index: true }) type: ProductType;
  @Prop({ required: true, unique: true }) slug: string;
  @Prop({ required: true }) title: string;
  @Prop() titleHi?: string;
  @Prop({ required: true, maxlength: 300 }) summary: string;
  @Prop({ default: '' }) description: string;
  @Prop({ type: [String], default: [] }) images: string[];
  /** Short label shown on the home page card, e.g. "Live Sankalp". */
  @Prop() badge?: string;
  @Prop() badgeHi?: string;
  @Prop() category?: string; // pooja: graha-shanti, prosperity, protection, health ... | course: vedic, numerology, tarot ...
  /** Price in rupees, GST included. */
  @Prop({ required: true, min: 0 }) price: number;
  /** Optional "was" price shown struck through. */
  @Prop({ min: 0 }) mrp?: number;
  @Prop({ type: [String], default: [] }) includes: string[];
  // pooja
  @Prop() durationMinutes?: number;
  @Prop() performedBy?: string;
  // course
  @Prop() language?: string;
  @Prop() level?: string;
  @Prop() instructor?: string;
  @Prop({ type: [LessonSchema], default: [] }) lessons: Lesson[];
  @Prop({ default: 'published', enum: ['draft', 'published'], index: true }) status: string;
  @Prop({ default: 100 }) sortWeight: number;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);

export enum OrderStatus {
  Paid = 'paid',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum PoojaStatus {
  Scheduled = 'scheduled',
  Performed = 'performed',
}

@Schema({ _id: false })
export class PoojaDetails {
  @Prop({ required: true }) sankalpName: string;
  @Prop() gotra?: string;
  @Prop() preferredDate?: string; // YYYY-MM-DD
  @Prop() wishes?: string;
  @Prop({ default: PoojaStatus.Scheduled, enum: Object.values(PoojaStatus) }) status: PoojaStatus;
  @Prop() scheduledAt?: Date;
  @Prop() performedAt?: Date;
  @Prop() recordingUrl?: string;
  @Prop() noteToUser?: string;
}

@Schema({ timestamps: true })
export class ShopOrder {
  @Prop({ required: true, unique: true }) orderNumber: string; // KJ-24OCT-00001
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ required: true, enum: Object.values(ProductType) }) type: ProductType;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) amountPaise: number;
  @Prop({ default: 'wallet', enum: ['wallet', 'razorpay'] }) paymentMethod: string;
  @Prop({ default: OrderStatus.Paid, enum: Object.values(OrderStatus), index: true }) status: OrderStatus;
  @Prop({ type: PoojaDetails }) pooja?: PoojaDetails;
}
export type ShopOrderDocument = HydratedDocument<ShopOrder>;
export const ShopOrderSchema = SchemaFactory.createForClass(ShopOrder);
ShopOrderSchema.index({ userId: 1, createdAt: -1 });

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true }) productId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'ShopOrder' }) orderId: Types.ObjectId;
  @Prop({ type: [String], default: [] }) completedLessonIds: string[];
}
export type EnrollmentDocument = HydratedDocument<Enrollment>;
export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ userId: 1, productId: 1 }, { unique: true });

/** Simple atomic counter for readable order numbers. */
@Schema()
export class Counter {
  @Prop({ required: true, unique: true }) key: string;
  @Prop({ default: 0 }) seq: number;
}
export const CounterSchema = SchemaFactory.createForClass(Counter);
