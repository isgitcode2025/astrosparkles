import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Auth } from '../../common/auth/auth.decorators';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { AstroService } from './astro.service';
import { BirthInputDto, KundliRequestDto, MatchingRequestDto, PanchangQueryDto } from './dto/astro.dto';
import { buildKundliPdf } from './kundli.pdf';

/** Free Vedic tools. Public, but rate limited because each call uses provider credits. */
@ApiTags('Astrology tools')
@Controller('astro')
export class AstroController {
  constructor(
    private readonly astro: AstroService,
    private readonly config: ConfigService,
  ) {}

  @Post('kundli')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Free kundli: summary, ascendant, 9 planets (sign, degree, house, nakshatra, D9 sign), Vimshottari dasha, Mangal dosha',
    description: 'Apps draw the D1 chart from planets[].sign and the D9 chart from planets[].navamsaSign (ascendant.sign / ascendant.navamsaSign start the chart).',
  })
  kundli(@Body() dto: KundliRequestDto) {
    return this.astro.kundli(dto);
  }

  @Post('kundli/pdf')
  @HttpCode(200)
  @Auth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Download the kundli as a branded PDF (login required)' })
  async kundliPdf(@Body() dto: KundliRequestDto, @Res() res: Response) {
    const k = await this.astro.kundli(dto);
    const pdf = await buildKundliPdf(k, this.config.get('brand'), dto.chartStyle ?? 'north');
    const file = `${(dto.name || 'kundli').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-kundli.pdf`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${file}"`, 'Content-Length': String(pdf.length) });
    res.end(pdf);
  }

  @Post('matching')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Kundli matching: Ashtakoot guna milan (out of 36) with Mangal dosha for both' })
  matching(@Body() dto: MatchingRequestDto) {
    return this.astro.matching(dto.boy, dto.girl);
  }

  @Post('mangal-dosha')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Mangal (Manglik) dosha check' })
  mangal(@Body() dto: BirthInputDto) {
    return this.astro.mangalDosha(dto);
  }

  @Get('panchang')
  @ApiOperation({ summary: 'Panchang for a date and place (defaults: today, New Delhi): tithi, nakshatra, yoga, karana, choghadiya, rahu kaal' })
  panchang(@Query() q: PanchangQueryDto) {
    return this.astro.panchang(q.date, q.placeId);
  }
}
