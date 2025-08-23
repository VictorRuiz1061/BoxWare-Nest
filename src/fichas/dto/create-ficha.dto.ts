import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFichaDto {
    @IsNotEmpty({ message: 'El ID de la ficha no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID de la ficha debe ser un número.' })
  id_ficha: number;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;

    @IsNotEmpty({ message: 'La fecha de creación no puede estar vacía.' })
  @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: string;

    @IsNotEmpty({ message: 'La fecha de modificación no puede estar vacía.' })
  @IsString({ message: 'La fecha de modificación debe ser una cadena de texto.' })
  fecha_modificacion: string;

    @IsNotEmpty({ message: 'El programa no puede estar vacío.' })
  @IsNumber({}, { message: 'El programa debe ser un número.' })
  programa: number;
}

