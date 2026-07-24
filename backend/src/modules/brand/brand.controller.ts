import { Controller, Get, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { JwtAuthGuard } from '../../auth/auth.guard.js';
import { PermissionsGuard } from '../../auth/permissions.guard.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('brands.view')
  async findAll() {
    return this.brandService.findAll();
  }
}
