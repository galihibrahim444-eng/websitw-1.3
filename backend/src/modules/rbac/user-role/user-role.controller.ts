import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Patch, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/common';
import { UserRoleService } from './user-role.service.js';
import { QueryUserRoleDto } from './dto/query-user-role.dto.js';
import { JwtAuthGuard } from '../../../auth/auth.guard.js';
import { PermissionsGuard } from '../../../auth/permissions.guard.js';
import { Permissions } from '../../../common/decorators/permissions.decorator.js';

@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.view')
  async findAll(@Query() query: QueryUserRoleDto) {
    return this.userRoleService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.view')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userRoleService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.update')
  async create(
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.userRoleService.create(body.userId, body.roleId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.userRoleService.update(id, body.userId, body.roleId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.update')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userRoleService.delete(id);
  }
}
