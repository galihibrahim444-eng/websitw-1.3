import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PasswordService } from '../../auth/password.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(query: QueryUserDto) {
    return this.usersRepository.findAll(query);
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await this.passwordService.hashPassword(
      dto.password,
    );
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Jika email berubah, cek apakah email sudah dipakai user lain
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.usersRepository.update(id, {
      name: dto.name,
      email: dto.email,
    });
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.usersRepository.delete(id);
  }
}
