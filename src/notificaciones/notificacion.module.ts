import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificacion.service';
import { NotificacionesController } from './notificacion.controller';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionGateway } from './notificacion.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion])],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, NotificacionGateway],
  exports: [NotificacionesService, NotificacionGateway], // Exportamos para que otros módulos puedan usar el servicio
})
export class NotificacionesModule {}