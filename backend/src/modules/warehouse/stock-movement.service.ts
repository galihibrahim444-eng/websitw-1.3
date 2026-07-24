import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryStockMovementDto } from './dto/query-stock-movement.dto';
import { StockMovementRepository } from './stock-movement.repository';

@Injectable()
export class StockMovementService {
  constructor(private readonly stockMovementRepository: StockMovementRepository) {}

  async findAll(query: QueryStockMovementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.stockMovementRepository.findAll({
      ...query,
      page,
      limit,
    });

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const stockMovement = await this.stockMovementRepository.findById(id);
    if (!stockMovement) {
      throw new NotFoundException('Stock movement not found');
    }

    return {
      success: true,
      data: stockMovement,
    };
  }
}
