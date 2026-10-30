import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleDayDto {
  @ApiProperty({ minimum: 0, maximum: 6, example: 1, description: '0 = Sunday … 6 = Saturday' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6) day: number;
  @ApiProperty({ example: '10:00', description: 'Local start time (HH:mm, 24h)' }) @Matches(HHMM) start: string;
  @ApiProperty({ example: '13:00', description: 'Local end time (HH:mm, 24h). Must be after start.' }) @Matches(HHMM) end: string;
}

export class UpdateScheduleDto {
  @ApiProperty({ example: true, description: 'Accept scheduled (pre-booked) sessions' }) @IsBoolean() enabled: boolean;
  @ApiProperty({ enum: [15, 30, 45, 60], example: 30 }) @Type(() => Number) @IsIn([15, 30, 45, 60]) slotMinutes: number;
  @ApiProperty({ type: [ScheduleDayDto], description: 'Weekly hours. Several windows per day are allowed.' })
  @ValidateNested({ each: true }) @Type(() => ScheduleDayDto) @ArrayMaxSize(28) days: ScheduleDayDto[];
}

export class SlotsQuery {
  @ApiPropertyOptional({ example: '2026-10-26', description: 'First day (YYYY-MM-DD, astrologer local date). Default today.' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 14 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(14) days?: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Astrologer id' }) @IsMongoId() astrologerId: string;
  @ApiProperty({ example: '2026-10-26T04:30:00.000Z', description: 'Slot start exactly as returned by the slots endpoint' })
  @IsDateString() start: string;
  @ApiPropertyOptional({ example: 'Career change next year?' }) @IsOptional() @IsString() @MaxLength(300) topic?: string;
}

export class BookingListQuery {
  @ApiPropertyOptional({ enum: ['upcoming', 'past', 'all'], default: 'upcoming' })
  @IsOptional() @IsIn(['upcoming', 'past', 'all']) scope?: 'upcoming' | 'past' | 'all';
}
