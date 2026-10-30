import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser, CurrentUser } from '../../common/auth/auth.decorators';
import { Role } from '../users/user.schema';
import { ConsultationsService } from './consultations.service';
import { AstrologerReviewsQuery, EndConsultationDto, HistoryQuery, RequestConsultationDto, ReviewDto, ReviewReplyDto, SendMessageDto } from './dto/consultation.dto';

@ApiTags('Consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Post('request')
  @Auth()
  @ApiOperation({
    summary: 'User requests a chat or call with an online astrologer',
    description:
      'Checks wallet balance (or the free first chat). The astrologer gets a consultation:updated socket event and must accept within the timeout.',
  })
  request(@CurrentUser() user: AuthUser, @Body() dto: RequestConsultationDto) {
    return this.consultations.request(user.id, dto);
  }

  @Get('reviews/recent')
  @ApiOperation({ summary: 'Latest written reviews (4★ and above) for the home page (public)' })
  recentReviews(@Query('limit') limit?: string) {
    return this.consultations.recentReviews(limit ? parseInt(limit, 10) || 6 : 6);
  }

  @Get('reviews/astrologer/:astrologerId')
  @ApiOperation({ summary: "One astrologer's reviews with rating breakdown and consultations in the last 7 days (public)" })
  astrologerReviews(@Param('astrologerId') astrologerId: string, @Query() q: AstrologerReviewsQuery) {
    return this.consultations.astrologerReviews(astrologerId, q);
  }

  @Get('active')
  @Auth()
  @ApiOperation({ summary: 'My current requested or active consultation (as user or astrologer), or null' })
  active(@CurrentUser() user: AuthUser) {
    return this.consultations.activeFor(user.id);
  }

  @Get('my')
  @Auth()
  @ApiOperation({ summary: 'My consultation history as a user' })
  mine(@CurrentUser() user: AuthUser, @Query() q: HistoryQuery) {
    return this.consultations.history(user.id, 'user', q.page, q.limit);
  }

  @Get('astrologer/incoming')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Astrologer: pending requests and the active session' })
  incoming(@CurrentUser() user: AuthUser) {
    return this.consultations.incoming(user.id);
  }

  @Get('astrologer/history')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Astrologer: consultation history' })
  astroHistory(@CurrentUser() user: AuthUser, @Query() q: HistoryQuery) {
    return this.consultations.history(user.id, 'astrologer', q.page, q.limit);
  }

  @Get('astrologer/earnings')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Astrologer: earnings today and all time (after platform commission)' })
  earnings(@CurrentUser() user: AuthUser) {
    return this.consultations.earnings(user.id);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'One consultation (user or astrologer of that consultation)' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.get(user.id, id);
  }

  @Post(':id/accept')
  @Auth(Role.Astrologer)
  @HttpCode(200)
  @ApiOperation({ summary: 'Astrologer accepts a request; billing time starts now' })
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.accept(user.id, id);
  }

  @Post(':id/reject')
  @Auth(Role.Astrologer)
  @HttpCode(200)
  @ApiOperation({ summary: 'Astrologer declines a request' })
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.reject(user.id, id);
  }

  @Post(':id/cancel')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'User cancels a request before the astrologer accepts' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.cancel(user.id, id);
  }

  @Post(':id/end')
  @Auth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Either side ends an active consultation; the user is billed per started minute' })
  end(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: EndConsultationDto) {
    return this.consultations.end(user.id, id, dto.reason);
  }

  @Get(':id/messages')
  @Auth()
  @ApiOperation({ summary: 'Chat history of a consultation' })
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.listMessages(user.id, id);
  }

  @Post(':id/messages')
  @Auth()
  @ApiOperation({ summary: 'Send a chat message (REST fallback; apps normally use the socket event message:send)' })
  send(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.consultations.addMessage(user.id, id, dto.text, dto.clientId);
  }

  @Post(':id/review')
  @Auth()
  @ApiOperation({ summary: 'User rates the astrologer after the consultation' })
  review(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.consultations.review(user.id, id, dto);
  }

  @Post(':id/review/reply')
  @Auth(Role.Astrologer)
  @ApiOperation({ summary: 'Astrologer replies to the review of their consultation (once, public)' })
  reply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewReplyDto) {
    return this.consultations.replyToReview(user.id, id, dto.text);
  }

  @Get(':id/call-token')
  @Auth()
  @ApiOperation({ summary: 'Agora token for call/video consultations (returns 503 until Agora is configured)' })
  callToken(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultations.callToken(user.id, id);
  }
}
