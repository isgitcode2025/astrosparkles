import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleLoginDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/send')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Send login OTP to a mobile number',
    description: 'In development (OTP_PROVIDER=console) the code is 123456 and is also printed in the API log.',
  })
  send(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify OTP and log in (creates the account on first login)',
    description: 'Returns accessToken. Send it as "Authorization: Bearer <token>" on protected endpoints.',
  })
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with a Google ID token (web, Android or iOS)' })
  google(@Body() dto: GoogleLoginDto) {
    return this.auth.googleLogin(dto.idToken);
  }
}
