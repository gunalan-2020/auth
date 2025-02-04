/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { User } from 'src/user/user.entity';
import * as jwt from 'jsonwebtoken';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/share/config/config.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private configService: ConfigService<Config>,
  ) {}

  private readonly secretKey = this.configService.get<string>('JWT_SECRET');

  async login(email: string, password: string, rememberMe: boolean) {
    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const payload = { email: user.email, sub: user.id };
    const expiresIn = rememberMe ? '7d' : '1h';
    const token = this.jwtService.sign(payload, { expiresIn });

    return {
      message: 'Login successful',
      jwt: token,
      rememberMe: rememberMe,
      isEmailVeryfied: user.isEmailVerified,
    };
  }

  async verifyEmailToken(token: string): Promise<User> {
    try {
      // Verify the token (you can also use JWT if you signed it earlier when sending the verification email)
      const decoded: string | jwt.JwtPayload = jwt.verify(
        token,
        this.secretKey!,
      );

      // Check if the user exists in the database
      const user = await this.userService.findById(decoded['userId']); // Assuming the JWT contains userId
      if (!user) {
        throw new Error('User not found');
      }

      // If user exists and the token is valid, mark the email as verified
      user.isEmailVerified = true; // Assuming you have this field in your User entity
      await this.userService.save(user); // Save the updated user

      return user;
    } catch (error) {
      console.log(error);
      throw new Error('Invalid or expired token');
    }
  }

  async sendPasswordResetLink(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return { message: 'If email exists, a reset link will be sent' };

    // Generate a password reset token (valid for 15 minutes)
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    // Store token in the database (optional, but recommended for security)
    await this.userService.saveResetToken(user.id, token);

    // Send email with reset link (you can use Nodemailer or any email service)
    const resetLink = `${this.configService.get<string>('FRONTEND_URL')}/resetpassword?token=${token}`;
    await this.mailService.sendResetEmail(user.email, resetLink);

    return { message: 'Reset link sent if email exists' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.findByResetToken(token);

    if (!user) throw new Error('Invalid or expired token');

    await this.userService.updatePassword(user.id, newPassword);

    await this.userService.clearResetToken(user.id);

    return { message: 'Password updated successfully' };
  }
}
