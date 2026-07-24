import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockOpnameDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
