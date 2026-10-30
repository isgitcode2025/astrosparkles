import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ConsultMode } from '../consultation.schemas';

export class RequestConsultationDto {
  @ApiProperty({ description: 'Astrologer id (from the listing)' }) @IsMongoId() astrologerId: string;
  @ApiProperty({ enum: ConsultMode, example: 'chat' }) @IsIn(Object.values(ConsultMode)) mode: ConsultMode;
  @ApiPropertyOptional({ example: 'Will I get a government job this year?', description: 'Optional first question' })
  @IsOptional() @IsString() @MaxLength(500) topic?: string;
}

export class EndConsultationDto {
  @ApiPropertyOptional({ example: 'user_ended' }) @IsOptional() @IsString() @MaxLength(60) reason?: string;
}

export class ReviewReplyDto {
  @ApiProperty({ example: 'Thank you, wishing you the best!' }) @IsString() @MinLength(2) @MaxLength(500) text: string;
}

export class AstrologerReviewsQuery {
  @ApiPropertyOptional({ enum: ['reviews', 'all', '5'], default: 'reviews', description: 'reviews = with a written comment, all = every rating, 5 = five-star only' })
  @IsOptional() @IsIn(['reviews', 'all', '5']) filter?: 'reviews' | 'all' | '5';
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) limit?: number;
}

export class ReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional({ example: 'Very clear guidance' }) @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}

export class HistoryQuery {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Namaste, my date of birth is 15 Aug 1992.' }) @IsString() @MaxLength(4000) text: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) clientId?: string;
}
