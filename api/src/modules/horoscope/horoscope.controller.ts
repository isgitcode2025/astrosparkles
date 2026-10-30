import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import { HoroscopeQuery, UpsertHoroscopeDto } from './dto/horoscope.dto';
import { HoroscopeService } from './horoscope.service';

@ApiTags('Horoscope')
@Controller('horoscope')
export class HoroscopeController {
  constructor(private readonly horoscope: HoroscopeService) {}

  @Get('signs')
  @ApiOperation({ summary: 'The 12 signs with English/Hindi names and dates' })
  signs() {
    return this.horoscope.signs();
  }

  @Get()
  @ApiOperation({ summary: 'Horoscope for all 12 signs (daily, weekly or monthly; English or Hindi)' })
  all(@Query() q: HoroscopeQuery) {
    return this.horoscope.all(q.period, q.lang, q.date);
  }

  @Get(':sign')
  @ApiOperation({ summary: 'Horoscope for one sign. Accepts English slug (aries) or rashi (mesh).' })
  one(@Param('sign') sign: string, @Query() q: HoroscopeQuery) {
    return this.horoscope.one(sign.toLowerCase(), q.period, q.lang, q.date);
  }
}

@ApiTags('Admin')
@Controller('admin/horoscope')
export class AdminHoroscopeController {
  constructor(private readonly horoscope: HoroscopeService) {}

  @Get()
  @Auth(Role.Admin, Role.Editor)
  @ApiOperation({ summary: 'Editor: all 12 signs for a period and language, including drafts' })
  list(@Query() q: HoroscopeQuery) {
    return this.horoscope.editorList(q.period ?? 'daily', q.lang ?? 'en', q.date);
  }

  @Put()
  @Auth(Role.Admin, Role.Editor)
  @ApiOperation({ summary: 'Editor: create or update one horoscope text' })
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertHoroscopeDto) {
    return this.horoscope.upsert(user.id, dto);
  }
}
