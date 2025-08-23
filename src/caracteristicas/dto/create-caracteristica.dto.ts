import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsBoolean } from 'class-validator';

export class CreateCaracteristicaDto {
  @IsOptional() // Si quieres que sea opcional
  @IsBoolean({ message: 'El valor de placa_sena debe ser booleano.' })
  placa_sena?: boolean;

  @IsOptional()
    @IsBoolean({ message: 'El valor de descripción debe ser booleano.' })
  descripcion?: boolean;

    @IsNotEmpty({ message: 'El ID del material no puede estar vacío.' })
  @IsInt({ message: 'El ID del material debe ser un número entero.' })
  @IsPositive({ message: 'El ID del material debe ser un número positivo.' })
  material_id: number;
}
