import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { RoleModule } from './role/role.module.js';
import { RolePermissionModule } from './role-permission/role-permission.module.js';
import { UserRoleModule } from './user-role/user-role.module.js';
import { PermissionService } from './permission.service.js';
import { PermissionController } from './permission.controller.js';

@Module({
  imports: [PrismaModule, RoleModule, RolePermissionModule, UserRoleModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [RoleModule, PermissionService],
})
export class RbacModule {}
