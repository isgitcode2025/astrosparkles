import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { PERIODS, SIGN_SLUGS } from '../signs';

export class HoroscopeQuery {
  @ApiPropertyOptional({ enum: PERIODS, default: 'daily' }) @IsOptional() @IsIn(PERIODS) period?: (typeof PERIODS)[number];
  @ApiPropertyOptional({ enum: ['en', 'hi'], default: 'en' }) @IsOptional() @IsIn(['en', 'hi']) lang?: 'en' | 'hi';
  @ApiPropertyOptional({ example: '2026-10-24', description: 'Any date inside the period; defaults to today (India time)' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
}

export class ScoresDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) love?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) career?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) money?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) health?: number;
}

export class UpsertHoroscopeDto {
  @ApiProperty({ enum: SIGN_SLUGS }) @IsIn(SIGN_SLUGS) sign: string;
  @ApiProperty({ enum: PERIODS }) @IsIn(PERIODS) period: (typeof PERIODS)[number];
  @ApiProperty({ example: '2026-10-24', description: 'Any date inside the period' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @ApiProperty({ enum: ['en', 'hi'] }) @IsIn(['en', 'hi']) lang: 'en' | 'hi';
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(6000) text: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) luckyNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) luckyColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) mantra?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) remedy?: string;
  @ApiPropertyOptional({ type: ScoresDto }) @IsOptional() @ValidateNested() @Type(() => ScoresDto) scores?: ScoresDto;
  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'published' }) @IsOptional() @IsIn(['draft', 'published']) status?: string;
}
