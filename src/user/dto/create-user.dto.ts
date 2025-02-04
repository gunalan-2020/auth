// src/user/dto/create-user.dto.ts
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,20}$/, {
    message:
      'Password must be 6-20 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
  })
  password: string;
}
