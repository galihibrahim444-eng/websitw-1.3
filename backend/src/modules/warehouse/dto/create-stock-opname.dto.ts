import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockOpnameDto {
  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
