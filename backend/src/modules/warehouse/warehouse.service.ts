import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WarehouseRepository } from './warehouse.repository';
import { QueryStockDto } from './dto/query-stock.dto';
import { UpdateMinimumStockDto } from './dto/update-minimum-stock.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { RemoveStockDto } from './dto/remove-stock.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async findAll(query: QueryStockDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const warehouse = query.warehouse;
    const status = query.status;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const { data, total } = await this.warehouseRepository.findAll({
      page,
      limit,
      search,
      warehouse,
      status,
      sortBy,
      sortOrder,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const stock = await this.warehouseRepository.findById(id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async addStock(dto: AddStockDto, user: any) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const stock = await this.warehouseRepository.findByProductId(dto.productId);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const updatedStock = await this.warehouseRepository.addStockWithMovement(dto, stock, user?.userId);

    return {
      success: true,
      message: 'Stock berhasil ditambahkan',
      data: updatedStock,
    };
  }

  async removeStock(dto: RemoveStockDto, user: any) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const stock = await this.warehouseRepository.findByProductId(dto.productId);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (dto.quantity > stock.qty) {
      throw new BadRequestException('Stok tidak mencukupi');
    }

    const updatedStock = await this.warehouseRepository.removeStockWithMovement(dto, stock, user?.userId);

    return {
      success: true,
      message: 'Stock berhasil dikurangi',
      data: updatedStock,
    };
  }

  async updateMinimumStock(id: string, dto: UpdateMinimumStockDto) {
    const stock = await this.warehouseRepository.findById(id);
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return this.warehouseRepository.updateMinimumStock(id, dto.minimumStock);
  }
}
