import { IsEnum, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { TipoNotificacion, NivelNotificacion } from '../entities/notificacion.entity';

export class CreateNotificacionDto {
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @IsEnum(NivelNotificacion)
  @IsOptional()
  nivel?: NivelNotificacion;

  @IsString()
  titulo: string;

  @IsString()
  mensaje: string;

  @IsObject()
  @IsOptional()
  datos_adicionales?: any;

  @IsNumber()
  @IsOptional()
  material_id?: number;

  @IsNumber()
  @IsOptional()
  sitio_id?: number;

  @IsNumber()
  @IsOptional()
  movimiento_id?: number;

  @IsNumber()
  @IsOptional()
  area_id?: number;
} 