import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasService } from './alertas.service';
import { AlertasController } from './alertas.controller';
import { Alerta } from './entities/alerta.entity';
import { AlertaGateway } from './alertas.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Alerta])],
  controllers: [AlertasController],
  providers: [AlertasService, AlertaGateway],
  exports: [AlertasService, AlertaGateway], // Exportamos para que otros módulos puedan usar el servicio
})
export class AlertasModule {} 