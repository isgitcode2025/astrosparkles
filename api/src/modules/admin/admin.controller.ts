import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import {
  AdminAstrologersQuery,
  AdminBookingsQuery,
  AdminConsultationsQuery,
  AdminPaymentsQuery,
  AdminReviewsQuery,
  AdminTxnQuery,
  AdminUpdateAstrologerDto,
  AdminUpdateUserDto,
  AdminUsersQuery,
  HideReviewDto,
  PageQuery,
  WalletAdjustDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
@Auth(Role.Admin)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Dashboard numbers: users, astrologers, revenue (all time and today, IST) and a 14-day daily series' })
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  @ApiOperation({ summary: 'Users, searchable by name, phone or email' })
  users(@Query() q: AdminUsersQuery) {
    return this.admin.listUsers(q);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Block / unblock a user or set staff roles (admin, editor)' })
  updateUser(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.admin.updateUser(me.id, id, dto);
  }

  @Post('users/:id/wallet')
  @ApiOperation({ summary: 'Credit (positive) or debit (negative) a user wallet with a note. Written to the ledger as an adjustment.' })
  adjustWallet(@Param('id') id: string, @Body() dto: WalletAdjustDto) {
    return this.admin.adjustWallet(id, dto);
  }

  @Get('astrologers')
  @ApiOperation({ summary: 'All astrologer profiles with commission, badges and stats' })
  astrologers(@Query() q: AdminAstrologersQuery) {
    return this.admin.listAstrologers(q);
  }

  @Patch('astrologers/:id')
  @ApiOperation({ summary: 'Suspend / reinstate, set commission, badges and listing weight' })
  updateAstrologer(@Param('id') id: string, @Body() dto: AdminUpdateAstrologerDto) {
    return this.admin.updateAstrologer(id, dto);
  }

  @Get('consultations')
  @ApiOperation({ summary: 'All consultations, newest first' })
  consultations(@Query() q: AdminConsultationsQuery) {
    return this.admin.listConsultations(q);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Wallet recharge payments' })
  payments(@Query() q: AdminPaymentsQuery) {
    return this.admin.listPayments(q);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Wallet ledger across users, or for one user' })
  transactions(@Query() q: AdminTxnQuery) {
    return this.admin.listTransactions(q);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Scheduled session bookings' })
  bookings(@Query() q: AdminBookingsQuery) {
    return this.admin.listBookings(q);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Reviews for moderation' })
  reviews(@Query() q: AdminReviewsQuery) {
    return this.admin.listReviews(q);
  }

  @Patch('reviews/:consultationId')
  @ApiOperation({ summary: 'Hide or restore a review. Hidden reviews leave the public list and the rating.' })
  hideReview(@Param('consultationId') id: string, @Body() dto: HideReviewDto) {
    return this.admin.hideReview(id, dto.hidden);
  }

  @Get('subscribers')
  @ApiOperation({ summary: 'Newsletter subscribers' })
  subscribers(@Query() q: PageQuery) {
    return this.admin.listSubscribers(q);
  }
}
