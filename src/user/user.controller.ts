import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserRole } from 'src/share/enum/user-role.enum';
import { RolesGuard } from 'src/share/guard/roles.guard';
import { Roles } from 'src/share/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.userService.register(createUserDto);
    } catch (error) {
      console.error('Registration Error:', error);

      // Handle known validation errors (e.g., duplicate email)
      if (error?.code === '23505') {
        // 23505 is the error code for unique constraint violation (PostgreSQL)
        throw new BadRequestException('Email already exists.');
      }

      // Handle other unexpected errors
      throw new InternalServerErrorException('Registration failed.');
    }
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return await this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: number,
    @Body('role') role: UserRole,
    @Req() reqest,
  ) {
    console.log('reqest', reqest);
    if (reqest?.user?.id === Number(id)) {
      throw new ForbiddenException('You cannot change your own role.');
    }
    return await this.userService.updateRole(id, role);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('users/:id/status')
  async toggleUserStatus(
    @Param('id') id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return await this.userService.updateStatus(id, isActive);
  }
}
