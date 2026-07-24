import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { QueryStockDto } from './dto/query-stock.dto';
import { UpdateMinimumStockDto } from './dto/update-minimum-stock.dto';
import { AddStockDto } from './dto/add-stock.dto';
import { RemoveStockDto } from './dto/remove-stock.dto';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('stocks')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  async findAll(@Query() query: QueryStockDto) {
    return this.warehouseService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.warehouseService.findById(id);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addStock(
    @Body() dto: AddStockDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.addStock(dto, user);
  }

  @Post('remove')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async removeStock(
    @Body() dto: RemoveStockDto,
    @CurrentUser() user: any,
  ) {
    return this.warehouseService.removeStock(dto, user);
  }

  @Patch(':id/minimum-stock')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateMinimumStock(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMinimumStockDto,
  ) {
    return this.warehouseService.updateMinimumStock(id, dto);
  }
}
