import { IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProgramaDto {
  @IsNotEmpty()
  @IsString()
  nombre_programa: string;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  estado: boolean;

  @IsNotEmpty()
  @IsNumber()
  area_id: number;
}
