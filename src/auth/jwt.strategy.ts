// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/share/config/config.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>, // Inject UserRepository for validating user
    private configService: ConfigService<Config>,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from the Authorization header
    });
  }

  async validate(payload: JwtPayload) {
    // The payload contains the user information (e.g., user ID, email, etc.)
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    }); // Use the sub field (user ID)

    if (!user) {
      throw new Error('Unauthorized');
    }

    return user; // Return user to make it available in request object
  }
}
