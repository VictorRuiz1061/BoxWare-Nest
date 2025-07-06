import { IsString, IsEmail, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  codigo: string;

  @IsString()
  @Length(6, 50, { message: 'La contraseña debe tener entre 6 y 50 caracteres' })
  nuevaContrasena: string;
}
