import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RolePermissionRepository } from './role-permission.repository.js';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto.js';

@Injectable()
export class RolePermissionService {
  constructor(private readonly rolePermissionRepository: RolePermissionRepository) {}

  async findAll(query: QueryRolePermissionDto) {
    return this.rolePermissionRepository.findAll(query);
  }

  async findById(id: string) {
    const rolePermission = await this.rolePermissionRepository.findById(id);
    if (!rolePermission) {
      throw new NotFoundException('Role permission not found');
    }
    return rolePermission;
  }

  async create(roleId: string, permissionId: string) {
    const role = await this.rolePermissionRepository.findRoleById(roleId);
    const permission = await this.rolePermissionRepository.findPermissionById(permissionId);

    if (!role || !permission) {
      throw new BadRequestException('Invalid role or permission');
    }

    const existing = await this.rolePermissionRepository.findByRoleAndPermission(roleId, permissionId);
    if (existing) {
      throw new BadRequestException('Permission already assigned to role');
    }

    return this.rolePermissionRepository.create(roleId, permissionId);
  }

  async update(id: string, roleId: string, permissionId: string) {
    const rolePermission = await this.rolePermissionRepository.findById(id);
    if (!rolePermission) {
      throw new BadRequestException('Invalid role permission');
    }

    const role = await this.rolePermissionRepository.findRoleById(roleId);
    const permission = await this.rolePermissionRepository.findPermissionById(permissionId);

    if (!role || !permission) {
      throw new BadRequestException('Invalid role or permission');
    }

    const existing = await this.rolePermissionRepository.findByRoleAndPermission(roleId, permissionId);
    if (existing && existing.id !== id) {
      throw new BadRequestException('Permission already assigned to role');
    }

    return this.rolePermissionRepository.update(id, roleId, permissionId);
  }

  async delete(id: string) {
    const rolePermission = await this.rolePermissionRepository.findById(id);
    if (!rolePermission) {
      throw new BadRequestException('Role permission not found');
    }

    return this.rolePermissionRepository.delete(id);
  }
}
