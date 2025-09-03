import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoNotificacion {
  STOCK_BAJO = 'stock_bajo',
  PRESTAMO = 'prestamo',
  DEVOLUCION = 'devolucion',
  TRANSFERENCIA = 'transferencia',
  MATERIAL_NUEVO = 'material_nuevo',
  MOVIMIENTO_CRITICO = 'movimiento_critico',
  SISTEMA = 'sistema'
}

export enum NivelNotificacion {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum EstadoNotificacion {
  PENDIENTE = 'pendiente',
  LEIDA = 'leida',
  ARCHIVADA = 'archivada'
}

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  id_notificacion: number;

  @Column({
    type: 'enum',
    enum: TipoNotificacion,
    nullable: false
  })
  tipo: TipoNotificacion;

  @Column({
    type: 'enum',
    enum: NivelNotificacion,
    default: NivelNotificacion.INFO
  })
  nivel: NivelNotificacion;

  @Column({
    type: 'enum',
    enum: EstadoNotificacion,
    default: EstadoNotificacion.PENDIENTE
  })
  estado: EstadoNotificacion;

  @Column({ type: 'varchar', length: 255, nullable: false })
  titulo: string;

  @Column({ type: 'text', nullable: false })
  mensaje: string;

  @Column({ type: 'jsonb', nullable: true })
  datos_adicionales: any;

  @Column({ type: 'int', nullable: true })
  material_id: number;

  @Column({ type: 'int', nullable: true })
  sitio_id: number;

  @Column({ type: 'int', nullable: true })
  movimiento_id: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ type: 'int', nullable: true })
  usuario_id: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_lectura: Date;

  @Column({ type: 'boolean', default: false })
  enviada_websocket: boolean;
} 