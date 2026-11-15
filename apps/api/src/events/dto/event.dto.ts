import { IsString, IsOptional, IsUrl, IsBoolean, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventStatus } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startsAt: string; // ISO date

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsUrl()
  @IsOptional()
  onlineUrl?: string;

  @IsUrl()
  @IsOptional()
  sourceUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsInt()
  @Min(0)
  priceKes: number; // 0 = free
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceKes?: number;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class ListEventsQueryDto {
  @IsOptional()
  @IsString()
  orgSlug?: string;

  // Query-string values arrive as strings. Only the exact words "true" and
  // "false" become booleans; anything else is left as-is so @IsBoolean rejects it.
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isFree?: boolean; // true for priceKes=0, false for >0

  @IsOptional()
  @IsString()
  search?: string; // text search on title/description

  @IsOptional()
  @IsDateString()
  startAfter?: string;

  @IsOptional()
  @IsDateString()
  endBefore?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  // Capped: without a maximum, ?take=1000000 serialises the whole table.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;
}

