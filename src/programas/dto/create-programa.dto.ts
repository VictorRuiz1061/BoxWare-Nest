import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProgramaDto {
  @IsNotEmpty({ message: 'El ID del programa no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del programa debe ser un número.' })
  id_programa: number;

    @IsNotEmpty({ message: 'El nombre del programa no puede estar vacío.' })
  @IsString({ message: 'El nombre del programa debe ser una cadena de texto.' })
  nombre_programa: string;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  estado: boolean;

    @IsNotEmpty({ message: 'La fecha de creación no puede estar vacía.' })
  @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: string;

    @IsNotEmpty({ message: 'La fecha de modificación no puede estar vacía.' })
  @IsString({ message: 'La fecha de modificación debe ser una cadena de texto.' })
  fecha_modificacion: string;

    @IsNotEmpty({ message: 'El ID del área no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del área debe ser un número.' })
  area_id: number;
}
