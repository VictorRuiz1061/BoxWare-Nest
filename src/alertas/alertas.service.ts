import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alerta, TipoAlerta, NivelAlerta, EstadoAlerta } from './entities/alerta.entity';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { AlertaGateway } from './alertas.gateway';

@Injectable()
export class AlertasService {
  constructor(
    @InjectRepository(Alerta)
    private readonly alertaRepo: Repository<Alerta>,
    private readonly alertaGateway: AlertaGateway
  ) {}

  async create(createAlertaDto: CreateAlertaDto): Promise<Alerta> {
    const alerta = this.alertaRepo.create(createAlertaDto);
    const alertaGuardada = await this.alertaRepo.save(alerta);
    
    // Enviar la alerta por WebSocket en tiempo real
    await this.alertaGateway.enviarAlerta(alertaGuardada);
    
    return alertaGuardada;
  }

  async findAll(): Promise<Alerta[]> {
    return this.alertaRepo.find({
      relations: ['usuario'],
      order: { fecha_creacion: 'DESC' }
    });
  }

  async findPendientes(): Promise<Alerta[]> {
    return this.alertaRepo.find({
      where: { estado: EstadoAlerta.PENDIENTE },
      relations: ['usuario'],
      order: { fecha_creacion: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Alerta> {
    const alerta = await this.alertaRepo.findOne({
      where: { id_alerta: id },
      relations: ['usuario']
    });
    
    if (!alerta) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada`);
    }
    
    return alerta;
  }

  async update(id: number, updateAlertaDto: UpdateAlertaDto): Promise<Alerta> {
    const alerta = await this.findOne(id);
    Object.assign(alerta, updateAlertaDto);
    return this.alertaRepo.save(alerta);
  }

  async marcarComoLeida(id: number): Promise<Alerta> {
    const alerta = await this.findOne(id);
    alerta.estado = EstadoAlerta.LEIDA;
    alerta.fecha_lectura = new Date();
    return this.alertaRepo.save(alerta);
  }

  async marcarComoArchivada(id: number): Promise<Alerta> {
    const alerta = await this.findOne(id);
    alerta.estado = EstadoAlerta.ARCHIVADA;
    return this.alertaRepo.save(alerta);
  }

  async remove(id: number): Promise<void> {
    const result = await this.alertaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada`);
    }
  }

  // Métodos específicos para crear alertas del sistema
  async crearAlertaStockBajo(
    materialId: number, 
    sitioId: number, 
    stockActual: number, 
    stockMinimo: number = 5
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.STOCK_BAJO,
      nivel: NivelAlerta.WARNING,
      titulo: 'Stock Bajo de Material',
      mensaje: `El material con ID ${materialId} en el sitio ${sitioId} tiene un stock bajo. Stock actual: ${stockActual}, Stock mínimo recomendado: ${stockMinimo}`,
      datos_adicionales: {
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        sitio_id: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId
    });
  }

  async crearAlertaPrestamo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.PRESTAMO,
      nivel: NivelAlerta.INFO,
      titulo: 'Préstamo de Material',
      mensaje: `Se ha realizado un préstamo de ${cantidad} unidades del material ${materialId} desde el sitio ${sitioId}`,
      datos_adicionales: {
        cantidad_prestada: cantidad,
        sitio_origen: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      usuario_id: usuarioId
    });
  }

  async crearAlertaDevolucion(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.DEVOLUCION,
      nivel: NivelAlerta.INFO,
      titulo: 'Devolución de Material',
      mensaje: `Se ha registrado una devolución de ${cantidad} unidades del material ${materialId} al sitio ${sitioId}`,
      datos_adicionales: {
        cantidad_devuelta: cantidad,
        sitio_destino: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      usuario_id: usuarioId
    });
  }

  async crearAlertaTransferencia(
    materialId: number, 
    sitioOrigenId: number, 
    sitioDestinoId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.TRANSFERENCIA,
      nivel: NivelAlerta.INFO,
      titulo: 'Transferencia de Material',
      mensaje: `Se ha transferido ${cantidad} unidades del material ${materialId} desde el sitio ${sitioOrigenId} al sitio ${sitioDestinoId}`,
      datos_adicionales: {
        cantidad_transferida: cantidad,
        sitio_origen: sitioOrigenId,
        sitio_destino: sitioDestinoId
      },
      material_id: materialId,
      sitio_id: sitioDestinoId,
      usuario_id: usuarioId
    });
  }

  async crearAlertaMaterialNuevo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.MATERIAL_NUEVO,
      nivel: NivelAlerta.INFO,
      titulo: 'Nuevo Material Registrado',
      mensaje: `Se ha registrado un nuevo material con ID ${materialId} en el sitio ${sitioId} con ${cantidad} unidades iniciales`,
      datos_adicionales: {
        cantidad_inicial: cantidad,
        sitio_registro: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      usuario_id: usuarioId
    });
  }

  async crearAlertaMovimientoCritico(
    materialId: number, 
    sitioId: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    usuarioId: number
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.MOVIMIENTO_CRITICO,
      nivel: NivelAlerta.ERROR,
      titulo: 'Movimiento Crítico Detectado',
      mensaje: `Se ha detectado un movimiento crítico: ${tipoMovimiento} de ${cantidad} unidades del material ${materialId} en el sitio ${sitioId}`,
      datos_adicionales: {
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidad,
        sitio: sitioId
      },
      material_id: materialId,
      sitio_id: sitioId,
      usuario_id: usuarioId
    });
  }

  async crearAlertaSistema(
    titulo: string, 
    mensaje: string, 
    nivel: NivelAlerta = NivelAlerta.INFO
  ): Promise<Alerta> {
    return this.create({
      tipo: TipoAlerta.SISTEMA,
      nivel,
      titulo,
      mensaje,
      datos_adicionales: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Método para obtener estadísticas de alertas
  async obtenerEstadisticas() {
    const total = await this.alertaRepo.count();
    const pendientes = await this.alertaRepo.count({ where: { estado: EstadoAlerta.PENDIENTE } });
    const leidas = await this.alertaRepo.count({ where: { estado: EstadoAlerta.LEIDA } });
    const archivadas = await this.alertaRepo.count({ where: { estado: EstadoAlerta.ARCHIVADA } });

    return {
      total,
      pendientes,
      leidas,
      archivadas,
      porcentaje_pendientes: total > 0 ? (pendientes / total) * 100 : 0
    };
  }
} 