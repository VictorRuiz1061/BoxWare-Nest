import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSitioDto {
    @IsNotEmpty({ message: 'El nombre del sitio no puede estar vacío.' })
  @IsString({ message: 'El nombre del sitio debe ser una cadena de texto.' })
  nombre_sitio: string;

    @IsNotEmpty({ message: 'La ubicación no puede estar vacía.' })
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  ubicacion: string;

    @IsNotEmpty({ message: 'La ficha técnica no puede estar vacía.' })
  @IsString({ message: 'La ficha técnica debe ser una cadena de texto.' })
  ficha_tecnica: string;
  
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

    @IsNotEmpty({ message: 'El ID del tipo de sitio no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del tipo de sitio debe ser un número.' })
  @Type(() => Number)
  tipo_sitio_id: number;
}
