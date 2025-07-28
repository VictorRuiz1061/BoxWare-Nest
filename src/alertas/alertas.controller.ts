import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AlertasService } from './alertas.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { NivelAlerta } from './entities/alerta.entity';

@Controller('alertas')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Post()
  @RequirePermiso('alertas', 'crear')
  create(@Body() createAlertaDto: CreateAlertaDto) {
    return this.alertasService.create(createAlertaDto);
  }

  @Get()
  @RequirePermiso('alertas', 'ver')
  findAll(@Query('estado') estado?: string) {
    if (estado === 'pendientes') {
      return this.alertasService.findPendientes();
    }
    return this.alertasService.findAll();
  }

  @Get('estadisticas')
  @RequirePermiso('alertas', 'ver')
  obtenerEstadisticas() {
    return this.alertasService.obtenerEstadisticas();
  }

  @Get(':id')
  @RequirePermiso('alertas', 'ver')
  findOne(@Param('id') id: string) {
    return this.alertasService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermiso('alertas', 'actualizar')
  update(@Param('id') id: string, @Body() updateAlertaDto: UpdateAlertaDto) {
    return this.alertasService.update(+id, updateAlertaDto);
  }

  @Patch(':id/leer')
  @RequirePermiso('alertas', 'actualizar')
  marcarComoLeida(@Param('id') id: string) {
    return this.alertasService.marcarComoLeida(+id);
  }

  @Patch(':id/archivar')
  @RequirePermiso('alertas', 'actualizar')
  marcarComoArchivada(@Param('id') id: string) {
    return this.alertasService.marcarComoArchivada(+id);
  }

  @Delete(':id')
  @RequirePermiso('alertas', 'eliminar')
  remove(@Param('id') id: string) {
    return this.alertasService.remove(+id);
  }

  // Endpoints específicos para crear alertas del sistema
  @Post('stock-bajo')
  @RequirePermiso('alertas', 'crear')
  crearAlertaStockBajo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      stock_actual: number;
      stock_minimo?: number;
    }
  ) {
    return this.alertasService.crearAlertaStockBajo(
      payload.material_id,
      payload.sitio_id,
      payload.stock_actual,
      payload.stock_minimo
    );
  }

  @Post('prestamo')
  @RequirePermiso('alertas', 'crear')
  crearAlertaPrestamo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.alertasService.crearAlertaPrestamo(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('devolucion')
  @RequirePermiso('alertas', 'crear')
  crearAlertaDevolucion(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.alertasService.crearAlertaDevolucion(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('transferencia')
  @RequirePermiso('alertas', 'crear')
  crearAlertaTransferencia(
    @Body() payload: {
      material_id: number;
      sitio_origen_id: number;
      sitio_destino_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.alertasService.crearAlertaTransferencia(
      payload.material_id,
      payload.sitio_origen_id,
      payload.sitio_destino_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('material-nuevo')
  @RequirePermiso('alertas', 'crear')
  crearAlertaMaterialNuevo(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.alertasService.crearAlertaMaterialNuevo(
      payload.material_id,
      payload.sitio_id,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('movimiento-critico')
  @RequirePermiso('alertas', 'crear')
  crearAlertaMovimientoCritico(
    @Body() payload: {
      material_id: number;
      sitio_id: number;
      tipo_movimiento: string;
      cantidad: number;
      usuario_id: number;
    }
  ) {
    return this.alertasService.crearAlertaMovimientoCritico(
      payload.material_id,
      payload.sitio_id,
      payload.tipo_movimiento,
      payload.cantidad,
      payload.usuario_id
    );
  }

  @Post('sistema')
  @RequirePermiso('alertas', 'crear')
  crearAlertaSistema(
    @Body() payload: {
      titulo: string;
      mensaje: string;
      nivel?: NivelAlerta;
    }
  ) {
    return this.alertasService.crearAlertaSistema(
      payload.titulo,
      payload.mensaje,
      payload.nivel
    );
  }
} 