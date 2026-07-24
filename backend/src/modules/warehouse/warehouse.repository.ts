import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddStockDto } from './dto/add-stock.dto';
import { RemoveStockDto } from './dto/remove-stock.dto';

@Injectable()
export class WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly stockSelect = {
    id: true,
    productId: true,
    warehouseId: true,
    qty: true,
    minimumStock: true,
    createdAt: true,
    updatedAt: true,
    product: {
      select: {
        id: true,
        productCode: true,
        name: true,
        status: true,
      },
    },
    warehouse: {
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        isActive: true,
      },
    },
  };

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    warehouse?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = {
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        {
          product: {
            productCode: { contains: params.search, mode: 'insensitive' },
          },
        },
        {
          product: {
            name: { contains: params.search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (params.warehouse) {
      where.warehouseId = params.warehouse;
    }

    if (params.status) {
      where.product = {
        status: params.status,
      };
    }

    const orderBy = { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stock.findMany({
        where,
        skip,
        take: params.limit,
        orderBy,
        select: this.stockSelect,
      }),
      this.prisma.stock.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.stock.findFirst({
      where: { id, deletedAt: null },
      select: this.stockSelect,
    });
  }

  async findByProductId(productId: string) {
    return this.prisma.stock.findFirst({
      where: {
        productId,
        deletedAt: null,
      },
      select: this.stockSelect,
    });
  }

  async addStockWithMovement(dto: AddStockDto, stock: any, createdById?: string) {
    const beforeQty = stock.qty;
    const afterQty = beforeQty + dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      const updatedStock = await tx.stock.update({
        where: {
          id: stock.id,
          deletedAt: null,
        },
        data: {
          qty: afterQty,
          updatedAt: new Date(),
        },
        select: this.stockSelect,
      });

      await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          type: 'IN',
          qty: dto.quantity,
          beforeQty,
          afterQty,
          reason: 'ADD_STOCK',
          reference: dto.reference,
          note: dto.notes,
          createdById,
        },
      });

      return updatedStock;
    });
  }

  async removeStockWithMovement(dto: RemoveStockDto, stock: any, createdById?: string) {
    const beforeQty = stock.qty;
    const afterQty = beforeQty - dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      const updatedStock = await tx.stock.update({
        where: {
          id: stock.id,
          deletedAt: null,
        },
        data: {
          qty: afterQty,
          updatedAt: new Date(),
        },
        select: this.stockSelect,
      });

      await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          type: 'OUT',
          qty: dto.quantity,
          beforeQty,
          afterQty,
          reason: 'REMOVE_STOCK',
          reference: dto.reference,
          note: dto.notes,
          createdById,
        },
      });

      return updatedStock;
    });
  }

  async updateMinimumStock(id: string, minimumStock: number) {
    return this.prisma.stock.update({
      where: { id, deletedAt: null },
      data: {
        minimumStock,
      },
      select: this.stockSelect,
    });
  }
}
