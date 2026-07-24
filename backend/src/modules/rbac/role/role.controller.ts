import { Controller, Get, Param, ParseUUIDPipe, Post, Body, Patch, Delete, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { JwtAuthGuard } from '../../../auth/auth.guard.js';
import { PermissionsGuard } from '../../../auth/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.view')
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.roleService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.create')
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.delete')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.roleService.delete(id);
  }
}
