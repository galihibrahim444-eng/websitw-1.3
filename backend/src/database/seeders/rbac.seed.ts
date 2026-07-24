import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../../auth/password.service.js';

const prisma = new PrismaClient();
const passwordService = new PasswordService();

const permissions = [
  'dashboard.view',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'roles.view',
  'roles.create',
  'roles.update',
  'roles.delete',
  'permissions.view',
  'permissions.create',
  'permissions.update',
  'permissions.delete',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'brands.view',
  'brands.create',
  'brands.update',
  'brands.delete',
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'warehouses.view',
  'warehouses.create',
  'warehouses.update',
  'warehouses.delete',
  'inventory.view',
  'inventory.create',
  'inventory.update',
  'inventory.delete',
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.delete',
  'marketplaces.view',
  'marketplaces.create',
  'marketplaces.update',
  'marketplaces.delete',
  'reports.view',
  'reports.export',
  'settings.view',
  'settings.update',
] as const;

const adminRoleName = 'Administrator';
const adminEmail = 'admin@erp.local';
const adminName = 'Administrator';
const adminPassword = 'Admin123!';

async function ensurePermission(name: string) {
  const existing = await prisma.permission.findUnique({
    where: { name },
  });

  if (existing) {
    return existing;
  }

  return prisma.permission.create({
    data: {
      name,
      description: `Auto-generated permission for ${name}`,
    },
  });
}

async function ensureRole(name: string) {
  const existing = await prisma.role.findUnique({
    where: { name },
  });

  if (existing) {
    return existing;
  }

  return prisma.role.create({
    data: {
      name,
      description: 'System Administrator role',
    },
  });
}

async function ensureRolePermission(roleId: string, permissionId: string) {
  return prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
    update: {},
    create: {
      roleId,
      permissionId,
    },
  });
}

async function ensureAdminUser() {
  const hashedPassword = await passwordService.hashPassword(adminPassword);

  const user = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: adminName,
      passwordHash: hashedPassword,
      isActive: true,
      status: 'ACTIVE',
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashedPassword,
      isActive: true,
      status: 'ACTIVE',
    },
  });

  return user;
}

async function ensureUserRole(userId: string, roleId: string) {
  return prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

async function main() {
  const createdPermissions = await Promise.all(
    permissions.map((permissionName) => ensurePermission(permissionName)),
  );

  const adminRole = await ensureRole(adminRoleName);

  await Promise.all(
    createdPermissions.map((permission) =>
      ensureRolePermission(adminRole.id, permission.id),
    ),
  );

  const adminUser = await ensureAdminUser();
  await ensureUserRole(adminUser.id, adminRole.id);

  const permissionCount = await prisma.permission.count();
  const roleCount = await prisma.role.count({
    where: {
      name: adminRoleName,
    },
  });
  const adminUserCount = await prisma.user.count({
    where: {
      email: adminEmail,
    },
  });
  const rolePermissionCount = await prisma.rolePermission.count({
    where: {
      roleId: adminRole.id,
    },
  });
  const userRoleCount = await prisma.userRole.count({
    where: {
      roleId: adminRole.id,
    },
  });

  console.log('RBAC seed completed successfully.');
  console.log(`Permissions seeded: ${permissionCount}`);
  console.log(`Administrator role count: ${roleCount}`);
  console.log(`Admin user count: ${adminUserCount}`);
  console.log(`RolePermission mappings: ${rolePermissionCount}`);
  console.log(`UserRole mappings: ${userRoleCount}`);
}

main()
  .catch((error) => {
    console.error('RBAC seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
