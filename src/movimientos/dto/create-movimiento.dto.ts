import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovimientoDto {
    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;
  
    @IsNotEmpty({ message: 'El ID de usuario no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID de usuario debe ser un número.' })
  usuario_id: number;

  @IsOptional()
    @IsNumber({}, { message: 'El ID del usuario responsable debe ser un número.' })
  usuario_responsable_id?: number;

    @IsNotEmpty({ message: 'El tipo de movimiento no puede estar vacío.' })
  @IsNumber({}, { message: 'El tipo de movimiento debe ser un número.' })
  tipo_movimiento: number;

    @IsNotEmpty({ message: 'El ID del material no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del material debe ser un número.' })
  material_id: number;

    @IsNotEmpty({ message: 'La cantidad no puede estar vacía.' })
  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  cantidad: number;

    @IsNotEmpty({ message: 'El ID del sitio no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del sitio debe ser un número.' })
  sitio_id: number;
  
  @IsOptional()
    @IsNumber({}, { message: 'El ID del sitio de origen debe ser un número.' })
  sitio_origen_id?: number;

    @IsNumber({}, { message: 'El ID del sitio de destino debe ser un número.' })
  sitio_destino_id?: number;

    @IsString({ message: 'La fecha de creación debe ser una cadena de texto.' })
  fecha_creacion: string;

    @IsString({ message: 'La fecha de modificación debe ser una cadena de texto.' })
  fecha_modificacion: string;
}
