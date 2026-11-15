import { Transform } from 'class-transformer';
import {
  ArrayMaxSize, Equals, IsArray, IsBoolean, IsEmail, IsOptional, IsString, Length, Matches, MaxLength,
} from 'class-validator';

// Emails compare case-insensitively everywhere: store and look up lowercased.
const normaliseEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

class EmailField {
  @Transform(normaliseEmail)
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;
}

export class RegisterDto extends EmailField {
  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters.' })
  password: string;

  @Transform(trim)
  @IsString()
  @Length(1, 100, { message: 'Enter your name.' })
  name: string;

  // Kenyan or international: digits with an optional leading +, spaces allowed.
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
  @Matches(/^\+?\d{9,15}$/, { message: 'Enter a valid phone number, for example 0712345678.' })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  county?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  skills?: string[];

  @IsOptional()
  @IsBoolean()
  consentMarketing?: boolean;

  @Equals(true, { message: 'You must accept data-processing consent to join.' })
  consentDataProcessing: boolean;
}

export class LoginDto extends EmailField {
  @IsString()
  @MaxLength(128)
  password: string;
}

export class EmailOnlyDto extends EmailField {}

export class ResetPasswordDto {
  @IsString()
  @MaxLength(2048)
  token: string;

  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters.' })
  password: string;
}
