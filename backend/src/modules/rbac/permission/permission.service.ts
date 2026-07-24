import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { QueryPermissionDto } from './dto/query-permission.dto.js';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async findAll(query: QueryPermissionDto = new QueryPermissionDto()) {
    const result = await this.permissionRepository.findAll(query);
    const totalPages = Math.ceil(result.total / result.limit);
    return {
      ...result,
      totalPages,
    };
  }

  async findById(id: string) {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async create(dto: CreatePermissionDto) {
    return this.permissionRepository.create(dto);
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findById(id);
    return this.permissionRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.permissionRepository.delete(id);
  }
}
