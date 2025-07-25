import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { EmailService } from '../common/services/email.service';
import * as crypto from 'crypto';


// Interfaz para el objeto de código de verificación
interface VerificationCode {
  code: string;
  expiresAt: Date;
  userId: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  // Almacenamiento temporal de códigos de verificación (en producción usar Redis)
  private verificationCodes = new Map<string, VerificationCode>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Usuario)
    private readonly vendedorRepository: Repository<Usuario>,
    private readonly emailService: EmailService
  ) {}

  /**
   * Autentica a un usuario con su email y contraseña
   * @param email Email del usuario
   * @param contrasena Contraseña del usuario
   * @returns Token de acceso y datos del usuario
   * @throws UnauthorizedException si las credenciales son inválidas
   */
  async login(email: string, contrasena: string) {
    console.log(`Intentando login para usuario: ${email}`);
    
    // Buscar usuario por email
    const usuario = await this.vendedorRepository.findOne({
      where: { email },
      relations: ['rol'] // Cargar relación con rol para tener acceso a los permisos
    });

    // Si no existe el usuario o la contraseña no coincide, lanzar excepción
    if (!usuario) {
      console.log(`Usuario no encontrado: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log(`Usuario encontrado: ${usuario.email}, Rol: ${usuario.rol?.nombre_rol}`);

    // Comparar la contraseña ingresada con el hash almacenado
    const hash = crypto.createHash('sha256').update(contrasena).digest('hex');
    console.log(`Verificando contraseña: ${hash === usuario.contrasena ? 'Correcta' : 'Incorrecta'}`);
    
    if (hash !== usuario.contrasena) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    return this.generarToken(usuario);
  }

  /**
   * Genera un token JWT para un usuario
   * @param usuario Entidad de usuario
   * @returns Token JWT y datos del usuario
   */
  async generarToken(usuario: Usuario) {
    // Crear payload del token
    const payload = {
      sub: usuario.id_usuario, // Usar 'sub' como estándar JWT para el ID
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol_id: usuario.rol_id,
      nombre_rol: usuario.rol?.nombre_rol
    };

    console.log('Generando token con payload:', payload);

    // Devolver token y datos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol_id: usuario.rol_id,
        nombre_rol: usuario.rol?.nombre_rol
        // No incluir datos sensibles como la contraseña
      }
    };
  }

  /**
   * Genera y envía un código de verificación de 6 dígitos por correo
   */
  async forgotPassword(email: string) {
    // Validar formato de correo
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Formato de correo electrónico inválido');
    }

    const usuario = await this.vendedorRepository.findOne({ 
      where: { email },
      select: ['id_usuario', 'nombre', 'email', 'estado'] // Solo seleccionar campos necesarios
    });

    if (!usuario) {
      throw new UnauthorizedException('Correo no registrado');
    }

    // Verificar si el usuario está activo
    if (!usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo. Contacta al administrador.');
    }

    // Verificar si ya existe un código válido
    const existingCode = this.verificationCodes.get(email);
    if (existingCode && existingCode.expiresAt > new Date()) {
      const waitTime = Math.ceil((existingCode.expiresAt.getTime() - new Date().getTime()) / 1000 / 60);
      throw new BadRequestException(
        `Ya se envió un código. Por favor espera ${waitTime} minutos antes de solicitar uno nuevo.`
      );
    }

    // Enviar código de verificación por correo
    const result = await this.emailService.sendVerificationCode(email, usuario.nombre);

    if (!result.success) {
      throw new BadRequestException(
        result.error || 'Error al enviar el código de verificación'
      );
    }

    // Almacenar el código con tiempo de expiración (15 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.verificationCodes.set(email, {
      code: result.code,
      expiresAt,
      userId: usuario.id_usuario,
      attempts: 0 // Contador de intentos fallidos
    });

    // Limpiar códigos expirados
    this.cleanExpiredCodes();

    return {
      message: 'Código de verificación enviado al correo electrónico',
      email: email,
      expiresIn: '15 minutos'
    };
  }

  /**
   * Verifica el código de recuperación de contraseña
   */
  async verifyCode(email: string, codigo: string) {
    const storedData = this.verificationCodes.get(email);

    if (!storedData) {
      throw new UnauthorizedException('Código no encontrado o expirado');
    }

    if (new Date() > storedData.expiresAt) {
      this.verificationCodes.delete(email);
      throw new UnauthorizedException('Código expirado');
    }

    // Verificar número de intentos
    if (storedData.attempts >= 3) {
      this.verificationCodes.delete(email);
      throw new UnauthorizedException('Demasiados intentos fallidos. Solicita un nuevo código.');
    }

    if (storedData.code !== codigo) {
      // Incrementar contador de intentos fallidos
      storedData.attempts++;
      this.verificationCodes.set(email, storedData);

      const intentosRestantes = 3 - storedData.attempts;
      throw new UnauthorizedException(
        `Código incorrecto. Te quedan ${intentosRestantes} ${intentosRestantes === 1 ? 'intento' : 'intentos'}.`
      );
    }

    // Generar token temporal para cambio de contraseña
    const payload = {
      sub: storedData.userId,
      email: email,
      type: 'password_reset'
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '5m', // Token válido por 5 minutos
    });

    // Eliminar el código usado
    this.verificationCodes.delete(email);

    return {
      message: 'Código verificado correctamente',
      token: token
    };
  }

  /**
   * Permite cambiar la contraseña usando un token JWT válido
   */
  async resetPassword(token: string, nuevaContrasena: string) {
    try {
      // Validar longitud de la contraseña
      if (nuevaContrasena.length < 6 || nuevaContrasena.length > 50) {
        throw new BadRequestException('La contraseña debe tener entre 6 y 50 caracteres');
      }

      // Validar complejidad de la contraseña
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(nuevaContrasena)) {
        throw new BadRequestException(
          'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
        );
      }

      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Token inválido para cambio de contraseña');
      }

      const usuario = await this.vendedorRepository.findOne({
        where: { id_usuario: payload.sub },
        select: ['id_usuario', 'contrasena', 'estado'] // Solo seleccionar campos necesarios
      });

      if (!usuario) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      if (!usuario.estado) {
        throw new UnauthorizedException('Usuario inactivo. Contacta al administrador.');
      }

      // Verificar que la nueva contraseña sea diferente a la actual
      const newHash = crypto.createHash('sha256').update(nuevaContrasena).digest('hex');
      if (newHash === usuario.contrasena) {
        throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
      }

      // Actualizar contraseña
      usuario.contrasena = newHash;
      await this.vendedorRepository.save(usuario);

      return { 
        message: 'Contraseña actualizada exitosamente',
        redirectTo: '/login'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('El enlace de recuperación ha expirado. Solicita uno nuevo.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Enlace de recuperación inválido');
      }
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }

  /**
   * Limpia códigos de verificación expirados
   */
  private cleanExpiredCodes() {
    const now = new Date();
    for (const [email, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(email);
      }
    }
  }
}
