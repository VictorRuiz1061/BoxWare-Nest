import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSedeDto {
    @IsNotEmpty({ message: 'El nombre de la sede no puede estar vacío.' })
  @IsString({ message: 'El nombre de la sede debe ser una cadena de texto.' })
  nombre_sede: string;

    @IsNotEmpty({ message: 'La dirección de la sede no puede estar vacía.' })
  @IsString({ message: 'La dirección de la sede debe ser una cadena de texto.' })
  direccion_sede: string;

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

  @IsNumber({}, { message: 'El ID del centro debe ser un número.' })
  centro_id?: number;
}
