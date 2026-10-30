import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { AstrologerStatus } from '../astrologers/astrologer.schema';
import { BookingStatus } from '../consultations/booking.schema';
import { ConsultStatus } from '../consultations/consultation.schemas';
import { PaymentStatus } from '../wallet/wallet.schemas';

export class PageQuery {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class AdminUsersQuery extends PageQuery {
  @ApiPropertyOptional({ description: 'Name, phone or email' }) @IsOptional() @IsString() @MaxLength(60) q?: string;
  @ApiPropertyOptional({ enum: ['user', 'astrologer', 'admin', 'editor'] }) @IsOptional() @IsIn(['user', 'astrologer', 'admin', 'editor']) role?: string;
  @ApiPropertyOptional({ enum: ['active', 'blocked'] }) @IsOptional() @IsIn(['active', 'blocked']) status?: string;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ enum: ['active', 'blocked'] }) @IsOptional() @IsIn(['active', 'blocked']) status?: 'active' | 'blocked';
  @ApiPropertyOptional({ description: 'Staff roles to grant. Replaces the current staff roles (user and astrologer roles are kept).', example: ['editor'] })
  @IsOptional() @IsArray() @IsIn(['admin', 'editor'], { each: true }) staffRoles?: Array<'admin' | 'editor'>;
}

export class WalletAdjustDto {
  @ApiProperty({ example: 50, description: 'Rupees. Positive credits the wallet, negative debits it.' })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(-100000) @Max(100000) amount: number;
  @ApiProperty({ example: 'Goodwill credit for a dropped chat' }) @IsString() @MinLength(3) @MaxLength(200) note: string;
}

export class AdminAstrologersQuery extends PageQuery {
  @ApiPropertyOptional({ enum: AstrologerStatus }) @IsOptional() @IsIn(Object.values(AstrologerStatus)) status?: AstrologerStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) q?: string;
}

export class AdminUpdateAstrologerDto {
  @ApiPropertyOptional({ enum: [AstrologerStatus.Approved, AstrologerStatus.Suspended] })
  @IsOptional() @IsIn([AstrologerStatus.Approved, AstrologerStatus.Suspended]) status?: AstrologerStatus;
  @ApiPropertyOptional({ example: 40 }) @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPercent?: number;
  @ApiPropertyOptional({ example: ['top-rated'] })
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsIn(['new', 'top-rated', 'celebrity', 'rising-star'], { each: true }) badges?: string[];
  @ApiPropertyOptional({ example: 150, description: 'Higher shows earlier in "recommended" sort' }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000) sortWeight?: number;
}

export class AdminConsultationsQuery extends PageQuery {
  @ApiPropertyOptional({ enum: ConsultStatus }) @IsOptional() @IsIn(Object.values(ConsultStatus)) status?: ConsultStatus;
}

export class AdminPaymentsQuery extends PageQuery {
  @ApiPropertyOptional({ enum: PaymentStatus }) @IsOptional() @IsIn(Object.values(PaymentStatus)) status?: PaymentStatus;
}

export class AdminBookingsQuery extends PageQuery {
  @ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsIn(Object.values(BookingStatus)) status?: BookingStatus;
}

export class AdminTxnQuery extends PageQuery {
  @ApiPropertyOptional({ description: 'Only this user' }) @IsOptional() @IsString() @MaxLength(24) userId?: string;
}

export class AdminReviewsQuery extends PageQuery {
  @ApiPropertyOptional({ enum: ['all', 'hidden', 'low'], description: 'low = 1 or 2 stars' }) @IsOptional() @IsIn(['all', 'hidden', 'low']) filter?: 'all' | 'hidden' | 'low';
}

export class HideReviewDto {
  @ApiProperty() @IsBoolean() hidden: boolean;
}
