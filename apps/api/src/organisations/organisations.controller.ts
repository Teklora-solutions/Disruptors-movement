import { Controller, Get, Query, Param, Post, Body, Patch, Delete, UseGuards, Req, Header } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { CreateOrganisationDto, UpdateOrganisationDto } from './dto/organisation.dto';
import { Public } from '../auth/public.decorator';
import { PUBLIC_LIST_CACHE } from '../lib/cache-control';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly orgsService: OrganisationsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', PUBLIC_LIST_CACHE)
  @ApiOperation({ summary: 'Public list of organisations with optional filters' })
  @ApiResponse({ status: 200, description: 'List returned' })
  async list(
    @Query('slug') slug?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.orgsService.list({
      slug,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
      // Clamped rather than validated: a bad value falls back to the default
      // instead of reaching Prisma as NaN (a 500), and take is capped at 100.
      skip: clampInt(skip, 0, 0, Number.MAX_SAFE_INTEGER),
      take: clampInt(take, 20, 1, 100),
    });
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organisation (platform admins only)' })
  async create(@Req() req: Request, @Body() dto: CreateOrganisationDto) {
    const user = (req as any).user;
    return this.orgsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organisation (admins of org)' })
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateOrganisationDto) {
    const user = (req as any).user;
    return this.orgsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft‑delete organisation (admins of org)' })
  async delete(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.orgsService.softDelete(user.id, id);
  }

  @Get('pending-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organisations awaiting approval (platform admins)' })
  async pending(@Req() req: Request) {
    const user = (req as any).user;
    return this.orgsService.pendingReview(user.id);
  }
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}
