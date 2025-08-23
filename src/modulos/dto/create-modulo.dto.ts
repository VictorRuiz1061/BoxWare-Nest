import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateModuloDto {
    @IsNotEmpty({ message: 'La ruta no puede estar vacía.' })
  @IsString({ message: 'La ruta debe ser una cadena de texto.' })
  rutas: string;

    @IsNotEmpty({ message: 'La descripción de la ruta no puede estar vacía.' })
  @IsString({ message: 'La descripción de la ruta debe ser una cadena de texto.' })
  descripcion_ruta: string;

    @IsNotEmpty({ message: 'El mensaje de cambio no puede estar vacío.' })
  @IsString({ message: 'El mensaje de cambio debe ser una cadena de texto.' })
  mensaje_cambio: string;

    @IsString({ message: 'La imagen debe ser una cadena de texto.' })
  imagen: string;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;
  
    @IsNotEmpty({ message: 'El campo es_submenu no puede estar vacío.' })
  @IsBoolean({ message: 'El campo es_submenu debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  es_submenu: boolean;
  
  @ValidateIf(o => o.es_submenu === true)
  @IsNotEmpty({ message: 'Si es un submódulo, debe especificar el módulo padre' })
  @IsNumber({}, { message: 'El ID del módulo padre debe ser un número' })
  @Transform(({ value }) => value ? parseInt(value) : null)
  modulo_padre_id: number;
  
    @IsNotEmpty({ message: 'La fecha de acción no puede estar vacía.' })
  @IsString({ message: 'La fecha de acción debe ser una cadena de texto.' })
  fecha_accion: string;

}
