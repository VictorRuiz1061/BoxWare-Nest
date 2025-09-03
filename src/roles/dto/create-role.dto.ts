import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
    @IsNotEmpty({ message: 'El nombre del rol no puede estar vacío.' })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto.' })
  nombre_rol: string;

    @IsNotEmpty({ message: 'La descripción no puede estar vacía.' })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  descripcion: string;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;

    @IsNotEmpty({ message: 'La fecha de creación no puede estar vacía.' })
  @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: string;
}
