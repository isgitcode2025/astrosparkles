import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

/**
 * Birth details. Give either placeId (from GET /places/search) or latitude + longitude + timezone.
 * timezone is an IANA name (e.g. Asia/Kolkata); the server works out the UTC offset for that date,
 * including daylight saving abroad.
 */
export class BirthInputDto {
  @ApiPropertyOptional({ example: 'Ravi Sharma' }) @IsOptional() @IsString() @MaxLength(80) name?: string;
  @ApiPropertyOptional({ enum: ['male', 'female', 'other'] }) @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @ApiProperty({ example: '1992-08-15' }) @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be YYYY-MM-DD' }) dateOfBirth: string;
  @ApiProperty({ example: '06:45' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'timeOfBirth must be HH:mm (24 hour)' }) timeOfBirth: string;
  @ApiPropertyOptional({ example: '1269743', description: 'Place id from /places/search' }) @IsOptional() @IsString() placeId?: string;

  @ApiPropertyOptional({ example: 22.7196 }) @ValidateIf((o) => !o.placeId) @IsLatitude() latitude?: number;
  @ApiPropertyOptional({ example: 75.8577 }) @ValidateIf((o) => !o.placeId) @IsLongitude() longitude?: number;
  @ApiPropertyOptional({ example: 'Asia/Kolkata' }) @ValidateIf((o) => !o.placeId) @IsString() timezone?: string;
  @ApiPropertyOptional({ example: 'Indore, India' }) @IsOptional() @IsString() @MaxLength(120) placeName?: string;
}

export class KundliRequestDto extends BirthInputDto {
  @ApiPropertyOptional({ enum: ['north', 'south'], default: 'north', description: 'Chart style used in the PDF' })
  @IsOptional() @IsIn(['north', 'south']) chartStyle?: 'north' | 'south';
}

export class MatchingRequestDto {
  @ApiProperty({ type: BirthInputDto }) @ValidateNested() @Type(() => BirthInputDto) boy: BirthInputDto;
  @ApiProperty({ type: BirthInputDto }) @ValidateNested() @Type(() => BirthInputDto) girl: BirthInputDto;
}

export class PanchangQueryDto {
  @ApiPropertyOptional({ example: '2026-10-24', description: 'Defaults to today in the place time zone' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @ApiPropertyOptional({ example: '1273294', description: 'Place id; defaults to New Delhi' }) @IsOptional() @IsString() placeId?: string;
}
