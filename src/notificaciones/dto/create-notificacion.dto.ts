import { IsEnum, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { TipoNotificacion, NivelNotificacion } from '../entities/notificacion.entity';

export class CreateNotificacionDto {
    @IsEnum(TipoNotificacion, { message: 'El tipo de notificación no es válido.' })
  tipo: TipoNotificacion;

    @IsEnum(NivelNotificacion, { message: 'El nivel de notificación no es válido.' })
  @IsOptional()
  nivel?: NivelNotificacion;

    @IsString({ message: 'El título debe ser una cadena de texto.' })
  titulo: string;

    @IsString({ message: 'El mensaje debe ser una cadena de texto.' })
  mensaje: string;

    @IsObject({ message: 'Los datos adicionales deben ser un objeto.' })
  @IsOptional()
  datos_adicionales?: any;

    @IsNumber({}, { message: 'El ID del material debe ser un número.' })
  @IsOptional()
  material_id?: number;

    @IsNumber({}, { message: 'El ID del sitio debe ser un número.' })
  @IsOptional()
  sitio_id?: number;

    @IsNumber({}, { message: 'El ID del movimiento debe ser un número.' })
  @IsOptional()
  movimiento_id?: number;

    @IsNumber({}, { message: 'El ID del área debe ser un número.' })
  @IsOptional()
  area_id?: number;
} 