import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStockOpnameDto } from './dto/create-stock-opname.dto';
import { UpdateStockOpnameDto } from './dto/update-stock-opname.dto';
import { StockOpnameRepository } from './stock-opname.repository';

@Injectable()
export class StockOpnameService {
  constructor(private readonly stockOpnameRepository: StockOpnameRepository) {}

  async create(dto: CreateStockOpnameDto, user: any) {
    const stockOpname = await this.stockOpnameRepository.create({
      warehouseId: dto.warehouseId,
      notes: dto.notes,
      createdById: user?.userId,
    });

    return {
      success: true,
      message: 'Stock opname draft berhasil dibuat',
      data: stockOpname,
    };
  }

  async findAll() {
    const data = await this.stockOpnameRepository.findAll();

    return {
      data,
      total: data.length,
    };
  }

  async findById(id: string) {
    const stockOpname = await this.stockOpnameRepository.findById(id);
    if (!stockOpname) {
      throw new NotFoundException('Stock opname not found');
    }

    return stockOpname;
  }

  async update(id: string, dto: UpdateStockOpnameDto) {
    const stockOpname = await this.stockOpnameRepository.findById(id);
    if (!stockOpname) {
      throw new NotFoundException('Stock opname not found');
    }

    if (stockOpname.status !== 'DRAFT') {
      throw new BadRequestException('Stock Opname sudah selesai');
    }

    const updatedStockOpname = await this.stockOpnameRepository.update(id, dto);

    return {
      success: true,
      message: 'Stock opname draft berhasil diperbarui',
      data: updatedStockOpname,
    };
  }

  async finalize(id: string, user: any) {
    const stockOpname = await this.stockOpnameRepository.findById(id);
    if (!stockOpname) {
      throw new NotFoundException('Stock opname not found');
    }

    if (stockOpname.status !== 'DRAFT') {
      throw new BadRequestException('Stock Opname sudah selesai');
    }

    const finalizedStockOpname = await this.stockOpnameRepository.finalize(id, stockOpname, user?.userId);

    return {
      success: true,
      message: 'Stock opname berhasil diselesaikan',
      data: finalizedStockOpname,
    };
  }

  async delete(id: string) {
    const stockOpname = await this.stockOpnameRepository.findById(id);
    if (!stockOpname) {
      throw new NotFoundException('Stock opname not found');
    }

    if (stockOpname.status !== 'DRAFT') {
      throw new BadRequestException('Stock Opname sudah selesai');
    }

    await this.stockOpnameRepository.delete(id);

    return {
      success: true,
      message: 'Stock opname draft berhasil dihapus',
    };
  }
}
