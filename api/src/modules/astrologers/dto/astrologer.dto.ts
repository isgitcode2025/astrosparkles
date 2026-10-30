import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CONCERN_SLUGS, EXPERTISE_SLUGS, LANGUAGE_CODES } from '../../master/master-data';
import { Presence } from '../astrologer.schema';

const toArray = ({ value }: { value: unknown }) =>
  value === undefined || value === '' ? undefined : Array.isArray(value) ? value : String(value).split(',');

export class ListAstrologersQuery {
  @ApiPropertyOptional({ description: 'Comma-separated expertise slugs', example: 'vedic-astrology,tarot-reading' })
  @IsOptional() @Transform(toArray) @IsIn(EXPERTISE_SLUGS, { each: true }) expertise?: string[];

  @ApiPropertyOptional({ enum: CONCERN_SLUGS }) @IsOptional() @IsIn(CONCERN_SLUGS) concern?: string;

  @ApiPropertyOptional({ description: 'Comma-separated language codes', example: 'hi,en' })
  @IsOptional() @Transform(toArray) @IsIn(LANGUAGE_CODES, { each: true }) languages?: string[];

  @ApiPropertyOptional({ enum: ['male', 'female'] }) @IsOptional() @IsIn(['male', 'female']) gender?: string;

  @ApiPropertyOptional({ description: 'Only astrologers online right now' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() onlineOnly?: boolean;

  @ApiPropertyOptional({ enum: ['chat', 'call', 'video'] }) @IsOptional() @IsIn(['chat', 'call', 'video']) mode?: string;

  @ApiPropertyOptional({ description: 'Search by name' }) @IsOptional() @IsString() @MaxLength(60) q?: string;

  @ApiPropertyOptional({ enum: ['recommended', 'rating', 'experience', 'price-low', 'price-high'], default: 'recommended' })
  @IsOptional() @IsIn(['recommended', 'rating', 'experience', 'price-low', 'price-high']) sort?: string;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

export class RatesDto {
  @ApiProperty({ example: 20 }) @IsNumber() @Min(0) @Max(1000) chat: number;
  @ApiProperty({ example: 20 }) @IsNumber() @Min(0) @Max(1000) call: number;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @IsNumber() @Min(0) @Max(1000) video?: number;
}

export class ApplyAstrologerDto {
  @ApiProperty({ example: 'Acharya Mohan Tiwari' }) @IsString() @MinLength(3) @MaxLength(60) displayName: string;
  @ApiProperty({ enum: ['male', 'female', 'other'] }) @IsIn(['male', 'female', 'other']) gender: string;
  @ApiProperty({ example: 'I have practised Vedic astrology for 12 years...' }) @IsString() @MinLength(50) @MaxLength(3000) bioEn: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(3000) bioHi?: string;
  @ApiProperty({ example: ['vedic-astrology', 'numerology'] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(6) @IsIn(EXPERTISE_SLUGS, { each: true }) expertise: string[];
  @ApiProperty({ example: ['marriage', 'career'] })
  @IsArray() @ArrayMinSize(1) @IsIn(CONCERN_SLUGS, { each: true }) concerns: string[];
  @ApiProperty({ example: ['hi', 'en'] })
  @IsArray() @ArrayMinSize(1) @IsIn(LANGUAGE_CODES, { each: true }) languages: string[];
  @ApiProperty({ example: 12 }) @IsInt() @Min(0) @Max(70) experienceYears: number;
  @ApiPropertyOptional({ example: ['Jyotish Acharya'] }) @IsOptional() @IsArray() @IsString({ each: true }) qualifications?: string[];
  @ApiProperty({ type: RatesDto }) @ValidateNested() @Type(() => RatesDto) rates: RatesDto;
}

export class SetPresenceDto {
  @ApiProperty({ enum: [Presence.Online, Presence.Offline] })
  @IsIn([Presence.Online, Presence.Offline])
  presence: Presence.Online | Presence.Offline;
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ['approve', 'reject'] }) @IsIn(['approve', 'reject']) decision: 'approve' | 'reject';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @ApiPropertyOptional({ example: 50 }) @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPercent?: number;
}
