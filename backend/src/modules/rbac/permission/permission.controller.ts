import { Controller, Get, Param, ParseUUIDPipe, Post, Body, UsePipes, ValidationPipe, Patch, Delete, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { JwtAuthGuard } from '../../../auth/auth.guard.js';
import { PermissionsGuard } from '../../../auth/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.view')
  async findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.permissionService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.delete')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.permissionService.delete(id);
  }
}
