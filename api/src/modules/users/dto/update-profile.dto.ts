import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

export class BirthDetailsDto {
  @ApiPropertyOptional({ example: '1992-08-15' })
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth?: string;

  @ApiPropertyOptional({ example: '06:45' })
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) timeOfBirth?: string;

  @ApiPropertyOptional({ example: 'Indore, Madhya Pradesh, India' })
  @IsOptional() @IsString() @MaxLength(200) place?: string;

  @ApiPropertyOptional({ example: 22.7196 }) @IsOptional() @IsLatitude() latitude?: number;
  @ApiPropertyOptional({ example: 75.8577 }) @IsOptional() @IsLongitude() longitude?: number;
  @ApiPropertyOptional({ example: 'Asia/Kolkata' }) @IsOptional() @IsString() timezone?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ravi Sharma' }) @IsOptional() @IsString() @MaxLength(80) name?: string;
  @ApiPropertyOptional({ example: 'ravi@example.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ enum: ['male', 'female', 'other'] }) @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @ApiPropertyOptional({ enum: ['en', 'hi'] }) @IsOptional() @IsIn(['en', 'hi']) language?: string;
  @ApiPropertyOptional({ type: BirthDetailsDto })
  @IsOptional() @ValidateNested() @Type(() => BirthDetailsDto) birth?: BirthDetailsDto;
}
