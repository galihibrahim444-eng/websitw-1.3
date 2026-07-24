import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryStockMovementDto } from './dto/query-stock-movement.dto';

@Injectable()
export class StockMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly stockMovementSelect = {
    id: true,
    productId: true,
    type: true,
    beforeQty: true,
    qty: true,
    afterQty: true,
    adjustmentQty: true,
    reference: true,
    note: true,
    createdById: true,
    createdAt: true,
    stock: {
      select: {
        id: true,
        product: {
          select: {
            id: true,
            productCode: true,
            name: true,
          },
        },
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  async findAll(query: QueryStockMovementDto & { page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const where: any = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.createdBy) {
      where.createdById = query.createdBy;
    }

    if (query.reference) {
      where.reference = {
        contains: query.reference,
        mode: 'insensitive',
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};

      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }

      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.stockMovementSelect,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const mapped = data.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.stock?.product?.name ?? null,
      type: item.type,
      beforeQty: item.beforeQty,
      qty: item.qty,
      afterQty: item.afterQty,
      adjustmentQty: item.adjustmentQty,
      reference: item.reference,
      notes: item.note,
      createdBy: item.createdBy
        ? {
            id: item.createdBy.id,
            name: item.createdBy.name,
            email: item.createdBy.email,
          }
        : null,
      createdAt: item.createdAt,
    }));

    return { data: mapped, total };
  }

  async findById(id: string) {
    const stockMovement = await this.prisma.stockMovement.findUnique({
      where: { id },
      select: this.stockMovementSelect,
    });

    if (!stockMovement) {
      return null;
    }

    return {
      id: stockMovement.id,
      productId: stockMovement.productId,
      productName: stockMovement.stock?.product?.name ?? null,
      type: stockMovement.type,
      beforeQty: stockMovement.beforeQty,
      qty: stockMovement.qty,
      afterQty: stockMovement.afterQty,
      adjustmentQty: stockMovement.adjustmentQty,
      reference: stockMovement.reference,
      notes: stockMovement.note,
      createdBy: stockMovement.createdBy
        ? {
            id: stockMovement.createdBy.id,
            name: stockMovement.createdBy.name,
            email: stockMovement.createdBy.email,
          }
        : null,
      createdAt: stockMovement.createdAt,
    };
  }
}
