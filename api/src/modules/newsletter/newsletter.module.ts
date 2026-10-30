import {
  Body,
  Controller,
  HttpCode,
  Injectable,
  Module,
  Post,
} from '@nestjs/common';
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import {
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';
import { Model } from 'mongoose';

@Schema({ timestamps: true })
export class Subscriber {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;
  @Prop({ default: 'en' }) lang: string;
  @Prop({ default: 'footer' }) source: string;
  @Prop({ default: true }) active: boolean;
}
export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);

export class SubscribeDto {
  @ApiProperty({ example: 'you@example.com' })
  @IsEmail()
  @MaxLength(120)
  email: string;
  @ApiPropertyOptional({ enum: ['en', 'hi'] })
  @IsOptional()
  @IsIn(['en', 'hi'])
  lang?: string;
}

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(Subscriber.name)
    private readonly subscribers: Model<Subscriber>,
  ) {}

  /** Idempotent: subscribing twice keeps one row and re-activates it. */
  async subscribe(dto: SubscribeDto) {
    await this.subscribers.updateOne(
      { email: dto.email.toLowerCase().trim() },
      { $set: { active: true, lang: dto.lang ?? 'en' } },
      { upsert: true },
    );
    return { subscribed: true };
  }
}

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Subscribe an email to the daily horoscope / muhurat newsletter (public)',
  })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscriber.name, schema: SubscriberSchema },
    ]),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
