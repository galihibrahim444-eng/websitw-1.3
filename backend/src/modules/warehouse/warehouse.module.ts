import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { WarehouseRepository } from './warehouse.repository';
import { StockOpnameController } from './stock-opname.controller';
import { StockOpnameService } from './stock-opname.service';
import { StockOpnameRepository } from './stock-opname.repository';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';
import { StockMovementRepository } from './stock-movement.repository';

@Module({
  imports: [PrismaModule],
  controllers: [WarehouseController, StockOpnameController, StockMovementController],
  providers: [WarehouseService, WarehouseRepository, StockOpnameService, StockOpnameRepository, StockMovementService, StockMovementRepository],
  exports: [WarehouseService, WarehouseRepository, StockOpnameService, StockOpnameRepository, StockMovementService, StockMovementRepository],
})
export class WarehouseModule {}
