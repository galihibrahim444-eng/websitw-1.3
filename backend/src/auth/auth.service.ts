import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { UsersRepository } from '../modules/users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.passwordService.comparePassword(
      password,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  // Skeleton method to create JWT
  async createToken(payload: any) {
    return this.jwtService.signAsync(payload);
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
