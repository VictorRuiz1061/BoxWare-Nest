import { Controller, Post, Body, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  @Post('validacion')
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Intento de login con email: ${loginDto.email}`);
      
      if (!loginDto.email || !loginDto.contrasena) {
        throw new BadRequestException('Email y contraseña son requeridos');
      }
      
      const result = await this.authService.login(
        loginDto.email,
        loginDto.contrasena,
      );

      if (!result) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      return {
        message: 'Inicio de sesión exitoso',
        token: result.access_token,
        user: result.usuarios
      };
    } catch (error) {
      this.logger.error(`Error en login: ${error.message}`);
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Error en la validación de credenciales');
    }
  }
}
