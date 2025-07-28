import { IsEnum, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { TipoAlerta, NivelAlerta } from '../entities/alerta.entity';

export class CreateAlertaDto {
  @IsEnum(TipoAlerta)
  tipo: TipoAlerta;

  @IsEnum(NivelAlerta)
  @IsOptional()
  nivel?: NivelAlerta;

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
  usuario_id?: number;
} 