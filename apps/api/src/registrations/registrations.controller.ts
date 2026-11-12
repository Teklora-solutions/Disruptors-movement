import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly regs: RegistrationsService) {}

  @Post('event/:eventId')
  register(@Req() req: Request, @Param('eventId') eventId: string) {
    return this.regs.register(eventId, (req as any).user.id);
  }

  @Post(':id/cancel')
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.regs.cancel(id, (req as any).user.id);
  }

  @Get('me')
  mine(@Req() req: Request) {
    return this.regs.myRegistrations((req as any).user.id);
  }
}

