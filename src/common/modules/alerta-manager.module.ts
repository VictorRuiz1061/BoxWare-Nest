import { Module } from '@nestjs/common';
import { AlertaManagerService } from '../services/alerta-manager.service';
import { AlertasModule } from '../../alertas/alertas.module';

/**
 * Módulo común para la gestión de alertas
 * Proporciona servicios para la gestión automática de alertas del sistema
 */
@Module({
  imports: [
    AlertasModule // Importamos el módulo de alertas para usar su servicio
  ],
  providers: [AlertaManagerService],
  exports: [AlertaManagerService] // Exportamos el servicio para que pueda ser utilizado por otros módulos
})
export class AlertaManagerModule {} 