import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { loShu, loveScore, numerology } from './numerology';

class NumerologyDto {
  @ApiProperty({ example: '1992-08-15' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth: string;
  @ApiPropertyOptional({ example: 'Ravi Kumar Sharma' }) @IsOptional() @IsString() @MaxLength(100) fullName?: string;
}

class LoShuDto {
  @ApiProperty({ example: '1992-08-15' }) @Matches(/^\d{4}-\d{2}-\d{2}$/) dateOfBirth: string;
}

class LoveDto {
  @ApiProperty({ example: 'Ravi' }) @IsString() @MinLength(1) @MaxLength(60) yourName: string;
  @ApiProperty({ example: 'Priya' }) @IsString() @MinLength(1) @MaxLength(60) partnerName: string;
}

/** Calculators computed on our server (free, instant, no provider credits). */
@ApiTags('Calculators')
@Controller('calculators')
export class CalculatorsController {
  @Post('numerology')
  @HttpCode(200)
  @ApiOperation({ summary: 'Life path, birthday, destiny, soul urge, personality and personal year numbers' })
  numerology(@Body() dto: NumerologyDto) {
    return numerology(dto.dateOfBirth, dto.fullName);
  }

  @Post('lo-shu-grid')
  @HttpCode(200)
  @ApiOperation({ summary: 'Lo Shu grid with driver and conductor numbers, missing and repeated numbers, complete planes' })
  loShu(@Body() dto: LoShuDto) {
    return loShu(dto.dateOfBirth);
  }

  @Post('love')
  @HttpCode(200)
  @ApiOperation({ summary: 'Name-based love percentage (for entertainment)' })
  love(@Body() dto: LoveDto) {
    return { score: loveScore(dto.yourName, dto.partnerName), note: 'For fun only' };
  }
}
