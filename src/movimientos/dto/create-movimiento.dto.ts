import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovimientoDto {
  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;
  
  @IsNotEmpty()
  @IsNumber()
  usuario_id: number;

  @IsNotEmpty()
  @IsNumber()
  tipo_movimiento: number;

  @IsNotEmpty()
  @IsString()
  fecha_creacion: string;

  @IsNotEmpty()
  @IsString()
  fecha_modificacion: string;

}
