import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUsuarioDto {
    @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  nombre: string;

    @IsNotEmpty({ message: 'El apellido no puede estar vacío.' })
  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  apellido: string;

    @IsNotEmpty({ message: 'La edad no puede estar vacía.' })
  @IsNumber({}, { message: 'La edad debe ser un número.' })
  edad: number;

    @IsNotEmpty({ message: 'La cédula no puede estar vacía.' })
  @IsString({ message: 'La cédula debe ser una cadena de texto.' })
  cedula: string;

    @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  @IsString({ message: 'El correo electrónico debe ser una cadena de texto.' })
  email: string;

    @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  contrasena: string;

    @IsNotEmpty({ message: 'El teléfono no puede estar vacío.' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  telefono: string;

    @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (verdadero/falso).' })
  @Transform(({ value }) => value === 'true' || value === true || value === 1) // Convierte 1 o "true" a booleano
  estado: boolean;

  // El campo fecha_registro se genera automáticamente con @CreateDateColumn()

  @IsNumber({}, { message: 'El ID del rol debe ser un número.' })
  rol_id?: number;

  @IsString({ message: 'La imagen debe ser una cadena de texto.' })
  @IsOptional()
  imagen?: string;
}
