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
    const response = await this.authService.login(
      body.email,
      body.password,
      body.rememberMe,
    );

    if (!response.isEmailVeryfied) {
      return res.status(202).json('pleas verify your email');
    }

    return res.status(200).json(response);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.json({ message: 'Logged out' });
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      const user = await this.authService.verifyEmailToken(token);

      return { message: 'Email successfully verified', user };
    } catch (error) {
      console.log('error', error);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetLink(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
