import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePermisoDto {
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  nombre: string;

    @IsNotEmpty({ message: 'El ID del módulo no puede estar vacío.' })
  @IsArray({ message: 'El ID del módulo debe ser un array.' })
  @IsNumber({}, { each: true, message: 'Cada elemento del ID del módulo debe ser un número.' })
  @Type(() => Number)
  modulo_id: number[]; 

    @IsNotEmpty({ message: 'El ID del rol no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del rol debe ser un número.' })
  @Type(() => Number)
  rol_id: number;

    @IsBoolean({ message: 'El campo puede_ver debe ser un valor booleano.' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_ver?: boolean;

  @IsOptional()
    @IsBoolean({ message: 'El campo puede_crear debe ser un valor booleano.' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_crear?: boolean;

  @IsOptional()
    @IsBoolean({ message: 'El campo puede_actualizar debe ser un valor booleano.' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_actualizar?: boolean;

  @IsOptional()
    @IsBoolean({ message: 'El estado debe ser un valor booleano.' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  estado?: boolean;
}
