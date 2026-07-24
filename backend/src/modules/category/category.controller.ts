import { Controller, Get, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('categories.view')
  async findAll() {
    return this.categoryService.findAll();
  }
}
