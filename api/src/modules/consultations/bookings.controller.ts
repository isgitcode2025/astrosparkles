import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import { BookingsService } from './bookings.service';
import { BookingListQuery, CreateBookingDto, SlotsQuery, UpdateScheduleDto } from './dto/booking.dto';

@ApiTags('Scheduled sessions')
@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('astrologers/me/schedule')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'My weekly hours for scheduled sessions (astrologer)' })
  getSchedule(@CurrentUser() user: AuthUser) {
    return this.bookings.getSchedule(user.id);
  }

  @Put('astrologers/me/schedule')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Set weekly hours and slot length for scheduled sessions (astrologer)' })
  updateSchedule(@CurrentUser() user: AuthUser, @Body() dto: UpdateScheduleDto) {
    return this.bookings.updateSchedule(user.id, dto);
  }

  @Get('astrologers/:id/slots')
  @ApiOperation({ summary: 'Bookable chat slots for the next days, with price per slot (public). Times are UTC ISO strings.' })
  slots(@Param('id') id: string, @Query() q: SlotsQuery) {
    return this.bookings.slots(id, q.from, q.days ?? 7);
  }

  @Post('bookings')
  @Auth()
  @ApiOperation({ summary: 'Book a slot. The full price is taken from the wallet now and refunded if cancelled or not held.' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user.id, dto);
  }

  @Get('bookings/my')
  @Auth()
  @ApiOperation({ summary: 'My booked sessions (as a user)' })
  mine(@CurrentUser() user: AuthUser, @Query() q: BookingListQuery) {
    return this.bookings.list(user.id, 'user', q.scope);
  }

  @Get('bookings/astrologer')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Sessions booked with me (astrologer)' })
  astrologer(@CurrentUser() user: AuthUser, @Query() q: BookingListQuery) {
    return this.bookings.list(user.id, 'astrologer', q.scope);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(200)
  @Auth()
  @ApiOperation({ summary: 'Cancel with a full refund. Users: up to 2 h before start. Astrologers: any time before it ends.' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.cancel(user.id, id);
  }

  @Post('bookings/:id/start')
  @HttpCode(200)
  @Auth()
  @ApiOperation({ summary: 'Open the prepaid chat (either side, from 5 min before start). Returns the consultation id; safe to call again.' })
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.start(user.id, id);
  }
}
