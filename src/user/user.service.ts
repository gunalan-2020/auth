import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { MailService } from '../mail/mail.service';
import { UserRole } from 'src/share/enum/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password }: CreateUserDto = createUserDto;

    // Check if the user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user entity
    const user = this.userRepository.create({
      email: email,
      password: hashedPassword as string,
    });

    // Save user to DB
    await this.userRepository.save(user);

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, user.id);

    return { message: 'Registration successful. Please verify your email.' };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Save user (used after email verification)
  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async saveResetToken(userId: number, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new Error('User not found');

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.userRepository.save(user);
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetToken: token, resetTokenExpiry: MoreThan(new Date()) },
    });
  }

  async clearResetToken(userId: number) {
    await this.userRepository.update(userId, {
      resetToken: '',
      resetTokenExpiry: new Date(),
    });
  }

  async updatePassword(userId: number, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async updateRole(id: number, role: UserRole) {
    return await this.userRepository.update(id, { role });
  }

  async updateStatus(id: number, isActive: boolean) {
    return await this.userRepository.update(id, { isActive });
  }
}
