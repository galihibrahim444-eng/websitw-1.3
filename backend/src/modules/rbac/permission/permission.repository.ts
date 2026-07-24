import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { QueryPermissionDto } from './dto/query-permission.dto.js';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPermissionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const orderBy = { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({
        where: { deletedAt: null },
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.permission.count({
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
    return this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        createdById: null,
        updatedById: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdatePermissionDto) {
    return this.prisma.permission.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description ?? null,
        updatedById: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.permission.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: null,
      },
    });
  }
}
