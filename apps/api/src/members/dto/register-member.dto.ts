import { IsEmail, IsString, IsBoolean, IsOptional, IsArray, IsUrl, IsEnum } from 'class-validator';
import { PlatformRole } from '@prisma/client';

export class RegisterMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  consentDataProcessing: boolean; // must be true

  // optional profile fields
  @IsString()
  @IsOptional()
  county?: string;

  @IsArray()
  @IsOptional()
  interests?: string[];

  @IsArray()
  @IsOptional()
  skills?: string[];
}

