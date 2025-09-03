import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAreaDto {
  @IsNotEmpty({ message: 'El nombre del área no puede estar vacío.' })
  @IsString({ message: 'El nombre del área debe ser una cadena de texto.' })
  nombre_area: string;

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

  @IsNumber({}, { message: 'El ID de la sede debe ser un número.' })
  sede_id: number;
}