import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { QueryStockMovementDto } from './dto/query-stock-movement.dto';
import { StockMovementService } from './stock-movement.service';

@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async findAll(@Query() query: QueryStockMovementDto) {
    return this.stockMovementService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.stockMovementService.findById(id);
  }
}
