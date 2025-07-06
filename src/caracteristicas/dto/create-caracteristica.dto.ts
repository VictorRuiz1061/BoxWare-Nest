import { IsBoolean, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateCaracteristicaDto {
  @IsNotEmpty()
  @IsBoolean()
  placa_sena: boolean;

  @IsNotEmpty()
  @IsBoolean()
  descripcion: boolean;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  material_id: number;

}
