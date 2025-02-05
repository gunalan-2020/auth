import { Controller, Post, Body, Get, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';

import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { email: string; password: string; rememberMe: boolean },
  ) {
    try {
      const response = await this.authService.login(
        body.email,
        body.password,
        body.rememberMe,
      );

      if (!response.isEmailVeryfied) {
        throw new Error('pleas verify your email');
      }

      res.cookie('jwt', response.jwt, {
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: response.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
      });

      return res.status(200).json(response);
    } catch (e) {
      res.status(400).json({ error: { message: e?.message } });
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.json({ message: 'Logged out' });
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    try {
      const user = await this.authService.verifyEmailToken(token);

      return { message: 'Email successfully verified', user };
    } catch (error) {
      console.log('error', error);
      res.status(400).json({ error: { message: error?.message } });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetLink(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    try {
      return this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    } catch (error) {
      res.status(400).json({ error: { message: error?.message } });
    }
  }
}
