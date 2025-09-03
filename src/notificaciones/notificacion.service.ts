import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NivelNotificacion, Notificacion, TipoNotificacion, EstadoNotificacion } from './entities/notificacion.entity';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { UpdateNotificacionDto } from './dto/update-notificacion.dto';
import { NotificacionGateway } from './notificacion.gateway';

@Injectable() 
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepo: Repository<Notificacion>,
    private readonly notificacionGateway: NotificacionGateway
  ) {}

  async create(createNotificacionDto: CreateNotificacionDto): Promise<Notificacion> {
    const notificacion = this.notificacionRepo.create(createNotificacionDto);
    const notificacionGuardada = await this.notificacionRepo.save(notificacion);
    
    // Enviar la notificación por WebSocket en tiempo real
    await this.notificacionGateway.enviarNotificacion(notificacionGuardada);
    
    return notificacionGuardada;
  }

  async   findAll() {
    return this.notificacionRepo.find();
  }

  async findPendientes(): Promise<Notificacion[]> {
    return this.notificacionRepo.find({
      where: { estado: EstadoNotificacion.PENDIENTE },
      relations: ['area'],
      order: { fecha_creacion: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Notificacion> {
    const notificacion = await this.notificacionRepo.findOne({
      where: { id_notificacion: id },
      relations: ['area']
    });
    
    if (!notificacion) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    
    return notificacion;
  }

  async update(id: number, updateNotificacionDto: UpdateNotificacionDto): Promise<Notificacion> {
    const notificacion = await this.findOne(id);
    Object.assign(notificacion, updateNotificacionDto);
    return this.notificacionRepo.save(notificacion);
  }

  async marcarComoLeida(id: number): Promise<Notificacion> {
    const notificacion = await this.findOne(id);
    notificacion.estado = EstadoNotificacion.LEIDA;
    notificacion.fecha_lectura = new Date();
    return this.notificacionRepo.save(notificacion);
  }

  async marcarComoArchivada(id: number): Promise<Notificacion> {
    const notificacion = await this.findOne(id);
    notificacion.estado = EstadoNotificacion.ARCHIVADA;
    return this.notificacionRepo.save(notificacion);
  }

  async remove(id: number): Promise<void> {
    const result = await this.notificacionRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
  }

  // Métodos específicos para crear notificaciones del sistema
  async crearNotificacionStockBajo(
    materialId: number, 
    sitioId: number, 
    stockActual: number, 
    stockMinimo: number = 5,
    areaId?: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.STOCK_BAJO,
      nivel: NivelNotificacion.WARNING,
      titulo: 'Stock Bajo de Material',
      mensaje: `El material con ID ${materialId} en el sitio ${sitioId} tiene un stock bajo. Stock actual: ${stockActual}, Stock mínimo recomendado: ${stockMinimo}`,
      datos_adicionales: {
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        sitio_id: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  async crearNotificacionPrestamo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.PRESTAMO,
      nivel: NivelNotificacion.INFO,
      titulo: 'Préstamo de Material',
      mensaje: `Se ha realizado un préstamo de ${cantidad} unidades del material ${materialId} desde el sitio ${sitioId}`,
      datos_adicionales: {
        cantidad_prestada: cantidad,
        sitio_origen: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  async crearNotificacionDevolucion(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.DEVOLUCION,
      nivel: NivelNotificacion.INFO,
      titulo: 'Devolución de Material',
      mensaje: `Se ha registrado una devolución de ${cantidad} unidades del material ${materialId} al sitio ${sitioId}`,
      datos_adicionales: {
        cantidad_devuelta: cantidad,
        sitio_destino: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  async crearNotificacionTransferencia(
    materialId: number, 
    sitioOrigenId: number, 
    sitioDestinoId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.TRANSFERENCIA,
      nivel: NivelNotificacion.INFO,
      titulo: 'Transferencia de Material',
      mensaje: `Se ha transferido ${cantidad} unidades del material ${materialId} desde el sitio ${sitioOrigenId} al sitio ${sitioDestinoId}`,
      datos_adicionales: {
        cantidad_transferida: cantidad,
        sitio_origen: sitioOrigenId,
        sitio_destino: sitioDestinoId
      },
      material_id: materialId,
      sitio_id: sitioDestinoId,
      area_id: areaId
    });
  }

  async crearNotificacionMaterialNuevo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.MATERIAL_NUEVO,
      nivel: NivelNotificacion.INFO,
      titulo: 'Nuevo Material Registrado',
      mensaje: `Se ha registrado un nuevo material con ID ${materialId} en el sitio ${sitioId} con ${cantidad} unidades iniciales`,
      datos_adicionales: {
        cantidad_inicial: cantidad,
        sitio_registro: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  async crearNotificacionMovimientoCritico(
    materialId: number, 
    sitioId: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    areaId: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.MOVIMIENTO_CRITICO,
      nivel: NivelNotificacion.ERROR,
      titulo: 'Movimiento Crítico Detectado',
      mensaje: `Se ha detectado un movimiento crítico: ${tipoMovimiento} de ${cantidad} unidades del material ${materialId} en el sitio ${sitioId}`,
      datos_adicionales: {
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidad,
        sitio: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  async crearNotificacionSistema(
    titulo: string, 
    mensaje: string, 
    nivel: NivelNotificacion = NivelNotificacion.INFO,
    areaId?: number
  ): Promise<Notificacion> {
    return this.create({
      tipo: TipoNotificacion.SISTEMA,
      nivel,
      titulo,
      mensaje,
      datos_adicionales: {
        timestamp: new Date().toISOString()
      },
      area_id: areaId
    });
  }

  // Método para obtener estadísticas de notificaciones
  async obtenerEstadisticas() {
    const total = await this.notificacionRepo.count();
    const pendientes = await this.notificacionRepo.count({ where: { estado: EstadoNotificacion.PENDIENTE } });
    const leidas = await this.notificacionRepo.count({ where: { estado: EstadoNotificacion.LEIDA } });
    const archivadas = await this.notificacionRepo.count({ where: { estado: EstadoNotificacion.ARCHIVADA } });

    return {
      total,
      pendientes,
      leidas,
      archivadas,
      porcentaje_pendientes: total > 0 ? (pendientes / total) * 100 : 0
    };
  }
} 