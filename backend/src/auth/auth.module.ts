import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { UsersModule } from '../modules/users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET || 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
    }),
    UsersModule,
    PrismaModule,
  ],
  providers: [AuthService, PasswordService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
