import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Patch, Query, UseGuards } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service.js';
import { QueryRolePermissionDto } from './dto/query-role-permission.dto.js';
import { JwtAuthGuard } from '../../../auth/auth.guard.js';
import { PermissionsGuard } from '../../../auth/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.view')
  async findAll(@Query() query: QueryRolePermissionDto) {
    return this.rolePermissionService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('roles.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolePermissionService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.update')
  async create(
    @Body() body: { roleId: string; permissionId: string },
  ) {
    return this.rolePermissionService.create(body.roleId, body.permissionId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { roleId: string; permissionId: string },
  ) {
    return this.rolePermissionService.update(id, body.roleId, body.permissionId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('permissions.update')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolePermissionService.delete(id);
  }
}
