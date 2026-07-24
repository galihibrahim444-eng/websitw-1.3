import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddStockDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
