import { Module } from '@nestjs/common';
import { NotificacionesManagerService } from '../services/notificaciones-manager.service';
import { NotificacionesModule } from '../../notificaciones/notificacion.module';

/**
 * Módulo común para la gestión de alertas
 * Proporciona servicios para la gestión automática de alertas del sistema
 */
@Module({
  imports: [
    NotificacionesModule // Importamos el módulo de alertas para usar su servicio
  ],
  providers: [NotificacionesManagerService],
  exports: [NotificacionesManagerService] // Exportamos el servicio para que pueda ser utilizado por otros módulos
})
export class NotificacionesManagerModule {} 