import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 dígitos' })
  codigo: string;
}
