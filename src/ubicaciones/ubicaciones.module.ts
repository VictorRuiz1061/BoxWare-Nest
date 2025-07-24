import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UbicacionesService } from './ubicaciones.service';
import { UbicacionesController } from './ubicaciones.controller';
import { UbicacionActual } from './entities/ubicacion-actual.entity';
import { Material } from '../materiales/entities/materiale.entity';
import { Sitio } from '../sitios/entities/sitio.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UbicacionActual, Material, Sitio, Usuario])
  ],
  controllers: [UbicacionesController],
  providers: [UbicacionesService],
  exports: [UbicacionesService]
})
export class UbicacionesModule {} 