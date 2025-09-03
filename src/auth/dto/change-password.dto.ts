import { IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
    @IsString({ message: 'La contraseña actual debe ser una cadena de texto.' })
  contrasenaActual: string;

    @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.' })
  @Length(6, 50, { message: 'La nueva contraseña debe tener entre 6 y 50 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, { message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número' })
  nuevaContrasena: string;

  @IsString({ message: 'La confirmación de contraseña debe ser una cadena de texto.' })
  @Length(6, 50, { message: 'La confirmación de contraseña debe tener entre 6 y 50 caracteres' })
  confirmarContrasena: string;
}
