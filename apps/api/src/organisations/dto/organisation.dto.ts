import { IsString, IsOptional, IsUrl, IsBoolean, IsEnum } from 'class-validator';
import { PlatformRole } from '@prisma/client';

export class CreateOrganisationDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsUrl()
  @IsOptional()
  feedUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  feedUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

