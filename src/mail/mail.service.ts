import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // Correct way to import nodemailer
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/share/config/config.interface';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService<Config>) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_SECRET'),
      },
    });
  }

  private readonly secretKey = this.configService.get<string>('JWT_SECRET');

  async sendVerificationEmail(email: string, userId: number): Promise<void> {
    const token = jwt.sign({ userId }, this.secretKey!, { expiresIn: '1h' }); // Generate a JWT token
    const verificationLink = `${this.configService.get<string>('FRONTEND_URL')}/login?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: 'Please verify your email',
      text: `Click here to verify your email: ${verificationLink}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent');
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendResetEmail(email: string, resetLink: string) {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };

    // Send the email
    await this.transporter.sendMail(mailOptions);

    console.log(`Password reset email sent to ${email}`);
  }
}
