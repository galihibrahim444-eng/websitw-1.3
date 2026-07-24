import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreateStockOpnameDto } from './dto/create-stock-opname.dto';
import { UpdateStockOpnameDto } from './dto/update-stock-opname.dto';
import { StockOpnameService } from './stock-opname.service';

@Controller('stock-opnames')
export class StockOpnameController {
  constructor(private readonly stockOpnameService: StockOpnameService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() dto: CreateStockOpnameDto,
    @CurrentUser() user: any,
  ) {
    return this.stockOpnameService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  async findAll() {
    return this.stockOpnameService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.stockOpnameService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStockOpnameDto,
  ) {
    return this.stockOpnameService.update(id, dto);
  }

  @Post(':id/finalize')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.update')
  async finalize(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: any,
  ) {
    return this.stockOpnameService.finalize(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('stocks.delete')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.stockOpnameService.delete(id);
  }
}
