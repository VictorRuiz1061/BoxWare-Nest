import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
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
  @IsNumber()
  material_id: number;

  @IsNotEmpty()
  @IsNumber()
  cantidad: number;

  @IsNotEmpty()
  @IsNumber()
  sitio_origen_id: number;
  
  @IsNotEmpty()
  @IsNumber()
  sitio_destino_id: number;
  
  @IsOptional()
  @IsNumber()
  responsable_id?: number;
  
  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  fecha_creacion: string;

  @IsOptional()
  @IsString()
  fecha_modificacion: string;
}
