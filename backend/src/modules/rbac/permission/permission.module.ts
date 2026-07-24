import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { PermissionController } from './permission.controller.js';
import { PermissionService } from './permission.service.js';
import { PermissionRepository } from './permission.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
  exports: [PermissionService, PermissionRepository],
})
export class PermissionModule {}
