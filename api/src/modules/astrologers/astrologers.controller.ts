import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import { AstrologerStatus } from './astrologer.schema';
import { AstrologersService } from './astrologers.service';
import { ApplyAstrologerDto, ListAstrologersQuery, ReviewApplicationDto, SetPresenceDto } from './dto/astrologer.dto';

@ApiTags('Astrologers')
@Controller('astrologers')
export class AstrologersController {
  constructor(private readonly astrologers: AstrologersService) {}

  @Get()
  @ApiOperation({ summary: 'List approved astrologers with filters, sorting and pagination (public)' })
  list(@Query() q: ListAstrologersQuery) {
    return this.astrologers.list(q);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Live counts: total, online now, women, consultations, top experience, per concern and per language (public)' })
  stats() {
    return this.astrologers.stats();
  }

  @Get('me/profile')
  @Auth()
  @ApiOperation({ summary: 'My astrologer profile and application status' })
  mine(@CurrentUser() user: AuthUser) {
    return this.astrologers.getMine(user.id);
  }

  @Post('apply')
  @Auth()
  @ApiOperation({ summary: 'Apply to join as an astrologer (any logged-in user). Goes to admin review.' })
  apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyAstrologerDto) {
    return this.astrologers.apply(user.id, dto);
  }

  @Patch('me/presence')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Astrologer goes online or offline' })
  presence(@CurrentUser() user: AuthUser, @Body() dto: SetPresenceDto) {
    return this.astrologers.setPresence(user.id, dto.presence);
  }

  @Get(':id/follow')
  @Auth()
  @ApiOperation({ summary: 'Whether I follow this astrologer, and the follower count' })
  followStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.astrologers.followStatus(user.id, id);
  }

  @Post(':id/follow')
  @Auth()
  @ApiOperation({ summary: 'Follow an astrologer (idempotent)' })
  follow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.astrologers.follow(user.id, id);
  }

  @Delete(':id/follow')
  @Auth()
  @ApiOperation({ summary: 'Unfollow an astrologer (idempotent)' })
  unfollow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.astrologers.unfollow(user.id, id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Public astrologer profile by slug' })
  bySlug(@Param('slug') slug: string) {
    return this.astrologers.getBySlug(slug);
  }
}

@ApiTags('Admin')
@Controller('admin/astrologers')
export class AdminAstrologersController {
  constructor(private readonly astrologers: AstrologersService) {}

  @Get('applications')
  @Auth(Role.Admin)
  @ApiQuery({ name: 'status', enum: AstrologerStatus, required: false })
  @ApiOperation({ summary: 'Astrologer applications by status (default pending)' })
  applications(@Query('status') status?: AstrologerStatus) {
    return this.astrologers.listApplications(status);
  }

  @Patch(':id/review')
  @Auth(Role.Admin)
  @ApiOperation({ summary: 'Approve or reject an astrologer application' })
  review(@Param('id') id: string, @Body() dto: ReviewApplicationDto) {
    return this.astrologers.review(id, dto);
  }
}
