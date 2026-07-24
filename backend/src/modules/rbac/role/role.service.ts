import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleRepository } from './role.repository.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { QueryRoleDto } from './dto/query-role.dto.js';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async findAll(query?: QueryRoleDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const result = await this.roleRepository.findAll(query ?? new QueryRoleDto());
    return {
      ...result,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async findById(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existingRoles = await this.roleRepository.findAll(new QueryRoleDto());
    const duplicate = existingRoles.data.find((role) => role.name === dto.name);
    if (duplicate) {
      throw new BadRequestException('Role already exists');
    }
    return this.roleRepository.create(dto);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findById(id);
    if (dto.name && dto.name !== role.name) {
      const existingRoles = await this.roleRepository.findAll(new QueryRoleDto());
      const duplicate = existingRoles.data.find(
        (existing) => existing.name === dto.name && existing.id !== id,
      );
      if (duplicate) {
        throw new BadRequestException('Role already exists');
      }
    }
    return this.roleRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.roleRepository.delete(id);
  }
}
