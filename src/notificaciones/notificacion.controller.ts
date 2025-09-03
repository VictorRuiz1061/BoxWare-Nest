import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificacionesService } from './notificacion.service';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { NivelNotificacion } from './entities/notificacion.entity';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post()
  @RequirePermiso('notificaciones', 'crear')
  create(@Body() createNotificacionDto: CreateNotificacionDto) {
    return this.notificacionesService.create(createNotificacionDto);
  }

  @Get()
  @RequirePermiso('notificaciones', 'ver')
  findAll(@Query('estado') estado?: string) {
    if (estado === 'pendientes') {
      return this.notificacionesService.findPendientes();
    }
    return this.notificacionesService.findAll();
  }

  @Get('estadisticas')
  @RequirePermiso('notificaciones', 'ver')
  obtenerEstadisticas() {
    return this.notificacionesService.obtenerEstadisticas();
  }

  @Get(':id')
  @RequirePermiso('notificaciones', 'ver')
  findOne(@Param('id') id: string) {
    return this.notificacionesService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermiso('notificaciones', 'actualizar')
  update(@Param('id') id: string, @Body() updateNotificacionDto: UpdateNotificacionDto) {
    return this.notificacionesService.update(+id, updateNotificacionDto);
  }

  @Patch(':id/leer')
  @RequirePermiso('notificaciones', 'actualizar')
  marcarComoLeida(@Param('id') id: string) {
    return this.notificacionesService.marcarComoLeida(+id);
  }

  @Patch(':id/archivar')
  @RequirePermiso('notificaciones', 'actualizar')
  marcarComoArchivada(@Param('id') id: string) {
    return this.notificacionesService.marcarComoArchivada(+id);
  }

  @Delete(':id')
  @RequirePermiso('notificaciones', 'eliminar')
  remove(@Param('id') id: string) {
    return this.notificacionesService.remove(+id);
  }

  // Endpoints específicos para crear notificaciones del sistema
  @Post('stock-bajo')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionStockBajo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      stock_actual: number;
      stock_minimo?: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionStockBajo(
      payload.material_id,
      payload.sitio_id,
      payload.stock_actual,
      payload.stock_minimo
    );
  }

  @Post('prestamo')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionPrestamo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionPrestamo(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('devolucion')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionDevolucion(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionDevolucion(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('transferencia')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionTransferencia(
    @Body() payload: {
      material_id: number;
      sitio_origen_id: number;
      sitio_destino_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionTransferencia(
      payload.material_id,
      payload.sitio_origen_id,
      payload.sitio_destino_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('material-nuevo')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionMaterialNuevo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionMaterialNuevo(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('movimiento-critico')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionMovimientoCritico(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      tipo_movimiento: string;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.notificacionesService.crearNotificacionMovimientoCritico(
      payload.material_id,
      payload.sitio_id,
      payload.tipo_movimiento,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('sistema')
  @RequirePermiso('notificaciones', 'crear')
  crearNotificacionSistema(
    @Body() payload: {
      titulo: string;
      mensaje: string;
      nivel?: NivelNotificacion;
    }
  ) {
    return this.notificacionesService.crearNotificacionSistema(
      payload.titulo,
      payload.mensaje,
      payload.nivel
    );
  }
} 