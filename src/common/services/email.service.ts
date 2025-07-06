import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuración para Gmail (puedes cambiar según tu proveedor)
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!emailUser || !emailPassword) {
      this.logger.error('Credenciales de correo no configuradas. Por favor configura EMAIL_USER y EMAIL_PASSWORD en el archivo .env');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  /**
   * Genera un código de 6 dígitos aleatorio
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Envía un código de verificación por correo electrónico
   */
  async sendVerificationCode(email: string, userName: string): Promise<{ code: string; success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        this.logger.error('Transporter no inicializado. Verifica la configuración de correo.');
        return {
          code: '',
          success: false,
          error: 'Error de configuración del servidor de correo'
        };
      }

      const verificationCode = this.generateVerificationCode();
      const emailUser = this.configService.get<string>('EMAIL_USER');
      
      if (!emailUser) {
        this.logger.error('EMAIL_USER no configurado');
        return {
          code: '',
          success: false,
          error: 'Error de configuración del servidor de correo'
        };
      }

      const mailOptions = {
        from: `"BoxWare" <${emailUser}>`,
        to: email,
        subject: 'Código de Recuperación de Contraseña - BoxWare',
        html: this.getEmailTemplate(userName, verificationCode),
      };

      // Verificar conexión antes de enviar
      try {
        await this.transporter.verify();
      } catch (verifyError) {
        this.logger.error('Error verificando conexión SMTP:', verifyError);
        return {
          code: '',
          success: false,
          error: 'Error de conexión con el servidor de correo'
        };
      }

      await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Código de verificación enviado a: ${email}`);
      
      return {
        code: verificationCode,
        success: true
      };
    } catch (error) {
      this.logger.error(`Error enviando código de verificación a ${email}:`, error);
      let errorMessage = 'Error al enviar el correo';
      
      if (error.code === 'EAUTH') {
        errorMessage = 'Error de autenticación con el servidor de correo';
      } else if (error.code === 'ESOCKET') {
        errorMessage = 'Error de conexión con el servidor de correo';
      }

      return {
        code: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Plantilla HTML para el correo de verificación
   */
  private getEmailTemplate(userName: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperación de Contraseña</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .code {
            background-color: #007bff;
            color: white;
            font-size: 24px;
            font-weight: bold;
            padding: 15px;
            text-align: center;
            border-radius: 5px;
            margin: 20px 0;
            letter-spacing: 5px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BoxWare</h1>
          <h2>Recuperación de Contraseña</h2>
        </div>
        
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Has solicitado restablecer tu contraseña. Para continuar con el proceso, utiliza el siguiente código de verificación:</p>
          
          <div class="code">${code}</div>
          
          <div class="warning">
            <strong>Importante:</strong>
            <ul>
              <li>No compartas este código con nadie</li>
              <li>Si no solicitaste este cambio, ignora este correo</li>
            </ul>
          </div>
          
          <p>Si tienes alguna pregunta, contacta al administrador del sistema.</p>
          
          <p>Saludos,<br>Equipo de BoxWare</p>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </body>
      </html>
    `;
  }
} 