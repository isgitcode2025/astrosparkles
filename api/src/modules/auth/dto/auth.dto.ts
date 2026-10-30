import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

/** Accepts 9876543210, 09876543210, 919876543210 or +919876543210 and normalises to +91XXXXXXXXXX. */
const toIndianE164 = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return value;
};

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: 'Indian mobile number' })
  @Transform(toIndianE164)
  @Matches(/^\+91[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone: string;
}

export class VerifyOtpDto extends SendOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  code: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'ID token from Google Sign-In on web, Android or iOS' })
  @IsString()
  idToken: string;
}
