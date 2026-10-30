import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Config')
@Controller('config')
export class BrandController {
  constructor(private readonly config: ConfigService) {}

  @Get('brand')
  @ApiOperation({
    summary: 'White-label brand settings',
    description: 'Public. Web and mobile apps load name, logo, colours, fonts, languages and support contacts from here.',
  })
  @ApiOkResponse({ description: '{ success: true, data: { name, tagline, logoUrl, colors, fonts, ... } }' })
  getBrand() {
    return this.config.get('brand');
  }

  @Get('public-keys')
  @ApiOperation({
    summary: 'Public client keys',
    description: 'Only keys that are safe to expose to apps (Razorpay key id, Agora app id, Google web client id). Secrets never leave the server.',
  })
  getPublicKeys() {
    return {
      razorpayKeyId: this.config.get<string>('razorpay.keyId'),
      agoraAppId: this.config.get<string>('agora.appId'),
      // the first id in GOOGLE_CLIENT_IDS is the web client used by the website's Google button
      googleWebClientId: (this.config.get<string[]>('google.clientIds') ?? [])[0] ?? '',
    };
  }
}
