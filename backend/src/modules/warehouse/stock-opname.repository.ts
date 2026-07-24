import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStockOpnameDto } from './dto/create-stock-opname.dto';
import { UpdateStockOpnameDto } from './dto/update-stock-opname.dto';

@Injectable()
export class StockOpnameRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly stockOpnameSelect = {
    id: true,
    warehouseId: true,
    opnameDate: true,
    status: true,
    notes: true,
    createdById: true,
    completedById: true,
    completedAt: true,
    createdAt: true,
    warehouse: {
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        isActive: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    completedBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    items: {
      select: {
        id: true,
        stockId: true,
        systemQty: true,
        physicalQty: true,
        differenceQty: true,
        stock: {
          select: {
            id: true,
            qty: true,
            productId: true,
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
              },
            },
          },
        },
      },
    },
  };

  async create(data: CreateStockOpnameDto & { createdById?: string }) {
    return this.prisma.stockOpname.create({
      data: {
        warehouseId: data.warehouseId,
        notes: data.notes,
        status: 'DRAFT',
        createdById: data.createdById,
        opnameDate: new Date(),
      },
      select: this.stockOpnameSelect,
    });
  }

  async findAll() {
    return this.prisma.stockOpname.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: this.stockOpnameSelect,
    });
  }

  async findById(id: string) {
    return this.prisma.stockOpname.findUnique({
      where: { id },
      select: this.stockOpnameSelect,
    });
  }

  async finalize(id: string, stockOpname: any, completedById?: string) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of stockOpname.items ?? []) {
        const beforeQty = item.stock.qty;
        const afterQty = item.physicalQty;
        const adjustmentQty = afterQty - beforeQty;

        await tx.stock.update({
          where: {
            id: item.stockId,
            deletedAt: null,
          },
          data: {
            qty: afterQty,
            updatedAt: new Date(),
          },
        });

        await tx.stockMovement.create({
          data: {
            stockId: item.stockId,
            productId: item.stock.productId,
            type: 'OPNAME',
            qty: Math.abs(adjustmentQty),
            beforeQty,
            afterQty,
            adjustmentQty,
            reason: 'STOCK_OPNAME',
            reference: id,
            note: stockOpname.notes ?? null,
            createdById: completedById,
          },
        });
      }

      return tx.stockOpname.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById,
        },
        select: this.stockOpnameSelect,
      });
    });
  }

  async update(id: string, dto: UpdateStockOpnameDto) {
    return this.prisma.stockOpname.update({
      where: { id },
      data: {
        ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      select: this.stockOpnameSelect,
    });
  }

  async delete(id: string) {
    return this.prisma.stockOpname.delete({
      where: { id },
      select: this.stockOpnameSelect,
    });
  }
}
