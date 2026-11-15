import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';

// An empty field in the form means "clear it": store null, not "".
const blankToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value;

/** PATCH /members/me. Every field is optional; only the ones sent change. */
export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 100, { message: 'Enter your name.' })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? (value.replace(/\s+/g, '') || null) : value))
  @ValidateIf((_, v) => v !== null)
  @Matches(/^\+?\d{9,15}$/, { message: 'Enter a valid phone number, for example 0712345678.' })
  phone?: string | null;

  @IsOptional()
  @Transform(blankToNull)
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  county?: string | null;

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
}
