import { IsDate, IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTipoSitioDto {
    @IsNotEmpty({ message: 'El nombre del tipo de sitio no puede estar vacío.' })
  @IsString({ message: 'El nombre del tipo de sitio debe ser una cadena de texto.' })
  nombre_tipo_sitio: string;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;

    @IsNotEmpty({ message: 'La fecha de creación no puede estar vacía.' })
  @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: String;

    @IsNotEmpty({ message: 'La fecha de modificación no puede estar vacía.' })
  @IsString({ message: 'La fecha de modificación debe ser una cadena de texto.' })
  fecha_modificacion: String;
}
