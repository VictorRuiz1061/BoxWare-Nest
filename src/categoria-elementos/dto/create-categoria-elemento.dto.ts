import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoriaElementoDto {
  @IsNotEmpty({ message: 'El campo codigo_upsena es obligatorio' })
    @IsString({ message: 'El código UNPSC debe ser una cadena de texto.' })
  codigo_unpsc: string;

    @IsNotEmpty({ message: 'El nombre de la categoría no puede estar vacío.' })
  @IsString({ message: 'El nombre de la categoría debe ser una cadena de texto.' })
  nombre_categoria: string;

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
}
 