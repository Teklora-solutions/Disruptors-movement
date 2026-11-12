import { IsInt, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { RegistrationStatus } from '@prisma/client';

export class RegisterEventDto {
  @IsOptional()
  @IsString()
  ticketCode?: string; // optional client‑provided code (ignored)
}

export class CancelRegistrationDto {
  @IsBoolean()
  confirm: boolean;
}

