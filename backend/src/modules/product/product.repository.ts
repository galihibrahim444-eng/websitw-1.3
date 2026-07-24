import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly productSelect = {
    id: true,
    productCode: true,
    name: true,
    description: true,
    categoryId: true,
    brandId: true,
    status: true,
    weight: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { productCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: this.productSelect,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: this.productSelect,
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findFirst({
      where: { productCode: sku, deletedAt: null },
      select: this.productSelect,
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        productCode: dto.sku,
        name: dto.name,
        description: dto.description,
        createdById: null,
        updatedById: null,
      },
      select: this.productSelect,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const data: Record<string, unknown> = {};

    if (dto.sku !== undefined) {
      data.productCode = dto.sku;
    }
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.product.update({
      where: { id, deletedAt: null },
      data,
      select: this.productSelect,
    });
  }

  async delete(id: string) {
    const result = await this.prisma.product.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }
}
