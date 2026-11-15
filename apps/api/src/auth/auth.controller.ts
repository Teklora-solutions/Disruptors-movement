import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from './public.decorator';
import { AuthService, publicUser, SessionUser } from './auth.service';
import { EmailOnlyDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { clearSessionCookies, setSessionCookies } from './cookies';

/** Per visitor IP, on top of the global 120/min: slows password guessing and mail spam. */
const STRICT = { default: { limit: 10, ttl: 60_000 } };
const ACCEPTED = { message: 'If that email has an account, we have sent a message to it.' };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(STRICT)
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { signedInUser } = await this.auth.register(dto);
    if (signedInUser) {
      await this.startSession(res, signedInUser);
      return { status: 'signed-in', user: publicUser(signedInUser) };
    }
    return { status: 'check-email', message: 'Check your inbox for a link to confirm your email.' };
  }

  @Public()
  @Throttle(STRICT)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.login(dto);
    await this.startSession(res, user);
    return publicUser(user);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookies(res);
  }

  /** The link in the verification email. A browser navigation, so it redirects. */
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string | undefined, @Res() res: Response) {
    const user = token ? await this.auth.verifyEmail(String(token)) : null;
    if (!user) return res.redirect(302, '/signin?verify=expired');
    await this.startSession(res, user);
    return res.redirect(302, '/dashboard?verified=1');
  }

  @Public()
  @Throttle(STRICT)
  @Post('resend-verification')
  @HttpCode(202)
  async resend(@Body() dto: EmailOnlyDto) {
    await this.auth.resendVerification(dto.email);
    return ACCEPTED;
  }

  @Public()
  @Throttle(STRICT)
  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() dto: EmailOnlyDto) {
    await this.auth.forgotPassword(dto.email);
    return ACCEPTED;
  }

  @Public()
  @Throttle(STRICT)
  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.resetPassword(dto.token, dto.password);
    await this.startSession(res, user);
    return publicUser(user);
  }

  private async startSession(res: Response, user: SessionUser) {
    setSessionCookies(res, await this.auth.sessionToken(user));
  }
}
