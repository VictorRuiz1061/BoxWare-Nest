import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { CreateMovimientoDto } from './create-movimiento.dto';

export class UpdateMovimientoDto {
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsOptional()
  @IsNumber()
  usuario_id?: number;

  @IsOptional()
  @IsNumber()
  tipo_movimiento?: number;

  @IsOptional()
  @IsNumber()
  material_id?: number;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  sitio_origen_id?: number;
  
  @IsOptional()
  @IsNumber()
  sitio_destino_id?: number;
  
  @IsOptional()
  @IsNumber()
  responsable_id?: number;
  
  @IsOptional()
  @IsString()
  observaciones?: string;
}
