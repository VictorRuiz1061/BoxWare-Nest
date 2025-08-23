import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCentroDto {
  @IsNotEmpty({ message: 'El nombre del centro no puede estar vacío.' })
  @IsString({ message: 'El nombre del centro debe ser una cadena de texto.' })
  nombre_centro: string;

  @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({
    message: 'El estado debe ser un valor booleano (verdadero/falso).',
  })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;

    @IsNotEmpty({ message: 'La fecha de creación no puede estar vacía.' })
  @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: string;

    @IsNotEmpty({ message: 'La fecha de modificación no puede estar vacía.' })
  @IsString({ message: 'La fecha de modificación debe ser una cadena de texto.' })
 fecha_modificacion: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del municipio debe ser un número.' })
  id_municipio?: number;
}
