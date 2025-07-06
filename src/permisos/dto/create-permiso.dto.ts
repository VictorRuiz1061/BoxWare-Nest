import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePermisoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  modulo_id: number[]; 

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  rol_id: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_ver?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_crear?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  puede_actualizar?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  estado?: boolean;
}
