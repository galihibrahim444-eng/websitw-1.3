import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto.js';

@Injectable()
export class RolePermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRolePermissionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const orderBy = { [query.sortBy ?? 'createdAt']: query.order ?? 'desc' } as Record<string, 'asc' | 'desc'>;

    const where: Record<string, any> = { deletedAt: null };
    if (query.roleId) {
      where.roleId = query.roleId;
    }
    if (query.permissionId) {
      where.permissionId = query.permissionId;
    }

    const [data, total] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          roleId: true,
          permissionId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.rolePermission.count({
        where,
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.rolePermission.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        roleId: true,
        permissionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findRoleById(roleId: string) {
    return this.prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
      select: { id: true },
    });
  }

  async findPermissionById(permissionId: string) {
    return this.prisma.permission.findFirst({
      where: { id: permissionId, deletedAt: null },
      select: { id: true },
    });
  }

  async findByRoleAndPermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        permissionId,
        deletedAt: null,
      },
      select: { id: true },
    });
  }

  async create(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        createdById: null,
        updatedById: null,
      },
      select: {
        id: true,
        roleId: true,
        permissionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, roleId: string, permissionId: string) {
    return this.prisma.rolePermission.update({
      where: { id },
      data: {
        roleId,
        permissionId,
        updatedById: null,
      },
      select: {
        id: true,
        roleId: true,
        permissionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.rolePermission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: null,
      },
    });
  }
}
