import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString({ message: 'El correo electrónico debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  email: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  contrasena: string;
}
