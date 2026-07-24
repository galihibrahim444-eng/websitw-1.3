import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { UserRoleRepository } from './user-role.repository.js';
import { UserRoleService } from './user-role.service.js';

@Module({
  imports: [PrismaModule],
  providers: [UserRoleRepository, UserRoleService],
  exports: [UserRoleRepository, UserRoleService],
})
export class UserRoleModule {}
