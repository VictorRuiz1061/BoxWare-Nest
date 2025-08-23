import { IsString, IsEmail, Length } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido.' })
  email: string;

  @IsString({ message: 'El código debe ser una cadena de texto.' })
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  codigo: string;

    @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.' })
  @Length(6, 50, { message: 'La contraseña debe tener entre 6 y 50 caracteres' })
  nuevaContrasena: string;
}
