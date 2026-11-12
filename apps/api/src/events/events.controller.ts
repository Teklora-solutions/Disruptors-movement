import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, ListEventsQueryDto } from './dto/event.dto';
import { Public } from '../auth/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get()
  list(@Query() query: ListEventsQueryDto) {
    return this.events.list(query);
  }

  @Get('pending-review')
  pending(@Req() req: Request) {
    return this.events.pendingReview((req as any).user.id);
  }

  @Post('org/:orgId')
  create(@Req() req: Request, @Param('orgId') orgId: string, @Body() dto: CreateEventDto) {
    return this.events.create((req as any).user.id, orgId, dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update((req as any).user.id, id, dto);
  }

  @Post(':id/approve')
  approve(@Req() req: Request, @Param('id') id: string) {
    return this.events.approve((req as any).user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.events.softDelete((req as any).user.id, id);
  }
}

