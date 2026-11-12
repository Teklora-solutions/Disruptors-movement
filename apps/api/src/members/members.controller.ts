import { Controller, Post, Body, Get, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { Request } from 'express';
import { Public } from '../auth/public.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterMemberDto) {
    return this.membersService.register(dto);
  }

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
  async deleteMe(@Req() req: Request) {
    const user = (req as any).user;
    return this.membersService.anonymise(user.id);
  }
}

