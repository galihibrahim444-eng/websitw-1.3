import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { QueryRoleDto } from './dto/query-role.dto.js';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRoleDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const orderBy = { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
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
      this.prisma.role.count({
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
    return this.prisma.role.findFirst({
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

  async create(dto: CreateRoleDto) {
    return this.prisma.role.create({
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

  async update(id: string, dto: UpdateRoleDto) {
    return this.prisma.role.update({
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
    return this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: null,
      },
    });
  }
}
