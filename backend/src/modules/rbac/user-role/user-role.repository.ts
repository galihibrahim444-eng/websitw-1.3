import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { QueryUserRoleDto } from './dto/query-user-role.dto.js';

@Injectable()
export class UserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUserRoleDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const orderBy = { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { deletedAt: null },
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.userRole.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: string) {
    return this.prisma.userRole.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        userId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
  }

  async findRoleById(roleId: string) {
    return this.prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
      select: { id: true },
    });
  }

  async findByUserAndRole(userId: string, roleId: string) {
    return this.prisma.userRole.findFirst({
      where: { userId, roleId, deletedAt: null },
      select: { id: true },
    });
  }

  async create(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        createdById: null,
        updatedById: null,
      },
      select: {
        id: true,
        userId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, userId: string, roleId: string) {
    return this.prisma.userRole.update({
      where: { id },
      data: {
        userId,
        roleId,
        updatedById: null,
      },
      select: {
        id: true,
        userId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.userRole.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: null,
      },
    });
  }
}
