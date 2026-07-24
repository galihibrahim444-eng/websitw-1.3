import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BrandRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
    });
  }
}
