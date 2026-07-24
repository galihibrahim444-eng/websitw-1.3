import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRoleRepository } from './user-role.repository.js';
import { QueryUserRoleDto } from './dto/query-user-role.dto.js';

@Injectable()
export class UserRoleService {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  async findAll(query: QueryUserRoleDto) {
    return this.userRoleRepository.findAll(query);
  }

  async findById(id: string) {
    const userRole = await this.userRoleRepository.findById(id);
    if (!userRole) {
      throw new NotFoundException('User role not found');
    }
    return userRole;
  }

  async create(userId: string, roleId: string) {
    const user = await this.userRoleRepository.findUserById(userId);
    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const role = await this.userRoleRepository.findRoleById(roleId);
    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    const existing = await this.userRoleRepository.findByUserAndRole(userId, roleId);
    if (existing) {
      throw new BadRequestException('Role already assigned to user');
    }

    return this.userRoleRepository.create(userId, roleId);
  }

  async update(id: string, userId: string, roleId: string) {
    const userRole = await this.userRoleRepository.findById(id);
    if (!userRole) {
      throw new NotFoundException('User role not found');
    }

    const user = await this.userRoleRepository.findUserById(userId);
    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const role = await this.userRoleRepository.findRoleById(roleId);
    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    const existing = await this.userRoleRepository.findByUserAndRole(userId, roleId);
    if (existing && existing.id !== id) {
      throw new BadRequestException('Role already assigned to user');
    }

    return this.userRoleRepository.update(id, userId, roleId);
  }

  async delete(id: string) {
    const userRole = await this.userRoleRepository.findById(id);
    if (!userRole) {
      throw new NotFoundException('User role not found');
    }

    return this.userRoleRepository.delete(id);
  }
}
