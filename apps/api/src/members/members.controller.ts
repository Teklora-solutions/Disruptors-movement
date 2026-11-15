import { Controller, Body, Get, Patch, Delete, Req, Res } from '@nestjs/common';
import { MembersService } from './members.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import type { Request, Response } from 'express';
import { clearSessionCookies } from '../auth/cookies';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as any).user;
    return this.membersService.getMe(user.id);
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() updates: Partial<RegisterMemberDto>) {
    const user = (req as any).user;
    return this.membersService.updateMe(user.id, updates);
  }

  @Delete('me')
  async deleteMe(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = (req as any).user;
    const result = await this.membersService.anonymise(user.id);
    clearSessionCookies(res);
    return result;
  }
}

