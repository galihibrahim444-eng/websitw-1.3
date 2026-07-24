import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateMinimumStockDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  minimumStock!: number;
}
