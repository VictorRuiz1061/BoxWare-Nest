import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreateInventarioDto {
  @IsInt()
  @IsNotEmpty()
  sitio_id: number;

  @IsInt()
  @IsPositive()
  stock: number;

  placa_sena?: string;
  descripcion?: string;
}
