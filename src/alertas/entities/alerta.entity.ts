import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoAlerta {
  STOCK_BAJO = 'stock_bajo',
  PRESTAMO = 'prestamo',
  DEVOLUCION = 'devolucion',
  TRANSFERENCIA = 'transferencia',
  MATERIAL_NUEVO = 'material_nuevo',
  MOVIMIENTO_CRITICO = 'movimiento_critico',
  SISTEMA = 'sistema'
}

export enum NivelAlerta {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum EstadoAlerta {
  PENDIENTE = 'pendiente',
  LEIDA = 'leida',
  ARCHIVADA = 'archivada'
}

@Entity('alertas')
export class Alerta {
  @PrimaryGeneratedColumn()
  id_alerta: number;

  @Column({
    type: 'enum',
    enum: TipoAlerta,
    nullable: false
  })
  tipo: TipoAlerta;

  @Column({
    type: 'enum',
    enum: NivelAlerta,
    default: NivelAlerta.INFO
  })
  nivel: NivelAlerta;

  @Column({
    type: 'enum',
    enum: EstadoAlerta,
    default: EstadoAlerta.PENDIENTE
  })
  estado: EstadoAlerta;

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