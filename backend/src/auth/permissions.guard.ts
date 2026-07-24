import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    // Jika endpoint tidak memiliki @Permissions(), langsung return true
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Query database untuk mendapatkan seluruh permission milik user
    const userPermissions = await this.prisma.userRole.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Flatten semua permission dari semua role user
    const userPermissionNames = new Set<string>();
    for (const userRole of userPermissions) {
      for (const rolePermission of userRole.role.rolePermissions) {
        if (!rolePermission.deletedAt) {
          userPermissionNames.add(rolePermission.permission.name);
        }
      }
    }

    // Bandingkan permission user dengan permission yang diminta endpoint
    // Jika salah satu cocok, return true
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissionNames.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
