import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { RolePermissionRepository } from './role-permission.repository.js';
import { RolePermissionService } from './role-permission.service.js';

@Module({
  imports: [PrismaModule],
  providers: [RolePermissionRepository, RolePermissionService],
  exports: [RolePermissionRepository, RolePermissionService],
})
export class RolePermissionModule {}
