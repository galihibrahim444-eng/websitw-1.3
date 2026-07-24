import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.view')
  async findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.delete')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    const deletedCount = await this.productService.delete(id);
    if (!deletedCount) {
      throw new NotFoundException('Product not found');
    }
    return { deleted: true };
  }
}
