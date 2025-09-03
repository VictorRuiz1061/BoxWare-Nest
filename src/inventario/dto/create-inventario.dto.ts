import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateInventarioDto {
  @IsInt({ message: 'El ID del sitio debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del sitio no puede estar vacío.' })
  sitio_id: number;

  @IsInt({ message: 'El ID del material debe ser un número entero.' })
  @IsNotEmpty({ message: 'El ID del material no puede estar vacío.' })
  material_id: number;

  @IsInt({ message: 'El stock debe ser un número entero.' })
  @IsPositive({ message: 'El stock debe ser un número positivo.' })
  stock: number;

  @IsString()
  @IsOptional()
  placa_sena?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}