import { Controller, Post, Body, UnauthorizedException, BadRequestException, Logger, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService
  ) {}

  @Post('registrar')
  async registrar(@Body() createUsuarioDto: CreateUsuarioDto) {
    try {
      // Puedes ajustar valores por defecto aquí si es necesario
      const usuario = await this.usuariosService.create(createUsuarioDto);
      return {
        message: 'Usuario registrado exitosamente',
        usuario,
      };
    } catch (error) {
      this.logger.error(`Error en registro: ${error.message}`);
      throw new BadRequestException('Error al registrar usuario: ' + error.message);
    }
  }

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

      // Devolver directamente el token y los datos del usuario sin estructura adicional
      // para que coincida con lo que espera el frontend
      return {
        message: 'Inicio de sesión exitoso',
        token: result.access_token,
        user: result.usuario
      };
    } catch (error) {
      this.logger.error(`Error en login: ${error.message}`);
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Error en la validación de credenciales');
    }
  }


  
  // 👇 ESTOS DEBEN ESTAR DENTRO DE LA CLASE
  @Post('recuperar')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      return await this.authService.forgotPassword(dto.email);
    } catch (error) {
      this.logger.error(`Error en recuperación de contraseña: ${error.message}`);
      
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      // Si es un error de configuración de correo
      if (error.message?.includes('configuración del servidor de correo')) {
        throw new BadRequestException(
          'El servicio de correo no está disponible en este momento. Por favor, contacta al administrador.'
        );
      }

      throw new BadRequestException('Error al procesar la solicitud de recuperación de contraseña');
    }
  }

  @Post('verificar-codigo')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.email, dto.codigo);
  }

  @Post('restablecer')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    // Primero verificar el código
    const verificationResult = await this.authService.verifyCode(dto.email, dto.codigo);
    
    // Si el código es válido, cambiar la contraseña
    return this.authService.resetPassword(verificationResult.token, dto.nuevaContrasena);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cambiar-contrasena')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    try {
      // Validar que las contraseñas coincidan
      if (dto.nuevaContrasena !== dto.confirmarContrasena) {
        throw new BadRequestException('La nueva contraseña y la confirmación no coinciden');
      }

      // Obtener el ID del usuario del token JWT
      const userId = req.user.id_usuario;
      
      // Llamar al servicio para cambiar la contraseña
      return await this.authService.changePassword(
        userId,
        dto.contrasenaActual,
        dto.nuevaContrasena
      );
    } catch (error) {
      this.logger.error(`Error en cambio de contraseña: ${error.message}`);
      
      // Reenviar excepciones específicas
      if (error instanceof BadRequestException || 
          error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Error al cambiar la contraseña: ' + error.message);
    }
  }
}
