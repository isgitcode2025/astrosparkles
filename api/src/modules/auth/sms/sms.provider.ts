import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<void>;
}

/** Development: prints the code to the API log instead of sending an SMS. */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger('OTP');

  async sendOtp(phone: string, code: string) {
    this.logger.warn(`OTP for ${phone}: ${code}`);
  }
}

/** Production: MSG91 OTP API (requires a DLT-approved template). */
@Injectable()
export class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';
  private readonly logger = new Logger('MSG91');

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string) {
    const authKey = this.config.get<string>('otp.msg91AuthKey');
    const templateId = this.config.get<string>('otp.msg91TemplateId');
    if (!authKey || !templateId) throw new ServiceUnavailableException('SMS is not configured');

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', templateId);
    url.searchParams.set('mobile', phone.replace('+', ''));
    url.searchParams.set('otp', code);

    const res = await fetch(url, { method: 'POST', headers: { authkey: authKey, 'Content-Type': 'application/json' } });
    if (!res.ok) {
      this.logger.error(`MSG91 error ${res.status}: ${await res.text()}`);
      throw new ServiceUnavailableException('Could not send OTP, please try again');
    }
  }
}
