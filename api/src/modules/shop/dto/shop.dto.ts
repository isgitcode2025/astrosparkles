import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsMongoId, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { OrderStatus, PoojaStatus, ProductType } from '../shop.schemas';

export class ProductsQuery {
  @ApiPropertyOptional({ enum: ProductType }) @IsOptional() @IsIn(Object.values(ProductType)) type?: ProductType;
  @ApiPropertyOptional({ example: 'graha-shanti' }) @IsOptional() @IsString() @MaxLength(40) category?: string;
}

export class PoojaDetailsDto {
  @ApiProperty({ example: 'Ravi Sharma', description: 'Name taken in the sankalp' }) @IsString() @MinLength(2) @MaxLength(80) sankalpName: string;
  @ApiPropertyOptional({ example: 'Kashyap' }) @IsOptional() @IsString() @MaxLength(40) gotra?: string;
  @ApiPropertyOptional({ example: '2026-11-02' }) @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) preferredDate?: string;
  @ApiPropertyOptional({ example: 'Peace and good health for the family' }) @IsOptional() @IsString() @MaxLength(500) wishes?: string;
}

export class CreateShopOrderDto {
  @ApiProperty() @IsMongoId() productId: string;
  @ApiPropertyOptional({ type: PoojaDetailsDto, description: 'Required for poojas' })
  @IsOptional() @ValidateNested() @Type(() => PoojaDetailsDto) pooja?: PoojaDetailsDto;
}

export class LessonProgressDto {
  @ApiProperty() @IsString() lessonId: string;
  @ApiProperty() @IsBoolean() completed: boolean;
}

// ---------- admin ----------

export class LessonDto {
  @ApiPropertyOptional() @IsOptional() @IsMongoId() _id?: string;
  @ApiProperty() @IsString() @MaxLength(150) title: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(3000) notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() freePreview?: boolean;
}

export class UpsertProductDto {
  @ApiProperty({ enum: ProductType }) @IsIn(Object.values(ProductType)) type: ProductType;
  @ApiProperty({ example: 'navgraha-shanti-pooja' }) @Matches(/^[a-z0-9-]{3,80}$/) slug: string;
  @ApiProperty() @IsString() @MaxLength(120) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) titleHi?: string;
  @ApiProperty() @IsString() @MaxLength(300) summary: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(8) @IsUrl({}, { each: true }) images?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) category?: string;
  @ApiPropertyOptional({ example: 'Live Sankalp', description: 'Short label on the home page card; empty string removes it' }) @IsOptional() @IsString() @MaxLength(30) badge?: string;
  @ApiPropertyOptional({ example: 'लाइव संकल्प' }) @IsOptional() @IsString() @MaxLength(30) badgeHi?: string;
  @ApiProperty() @IsNumber() @Min(0) @Max(500000) price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) mrp?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) includes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) performedBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) language?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) level?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) instructor?: string;
  @ApiPropertyOptional({ type: [LessonDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LessonDto) lessons?: LessonDto[];
  @ApiPropertyOptional({ enum: ['draft', 'published'] }) @IsOptional() @IsIn(['draft', 'published']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortWeight?: number;
}

export class UpdatePoojaOrderDto {
  @ApiPropertyOptional({ enum: PoojaStatus }) @IsOptional() @IsIn(Object.values(PoojaStatus)) status?: PoojaStatus;
  @ApiPropertyOptional({ example: '2026-11-02T07:00:00+05:30' }) @IsOptional() @IsString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() recordingUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) noteToUser?: string;
}

export class AdminOrdersQuery {
  @ApiPropertyOptional({ enum: ProductType }) @IsOptional() @IsIn(Object.values(ProductType)) type?: ProductType;
  @ApiPropertyOptional({ enum: OrderStatus }) @IsOptional() @IsIn(Object.values(OrderStatus)) status?: OrderStatus;
  @ApiPropertyOptional({ enum: PoojaStatus }) @IsOptional() @IsIn(Object.values(PoojaStatus)) poojaStatus?: PoojaStatus;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
}

export class IdParam {
  @IsMongoId() id: string;
}
