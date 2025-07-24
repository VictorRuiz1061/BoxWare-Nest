import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoMovimiento } from '../../tipos-movimientos/entities/tipos-movimiento.entity';
import { Material } from '../../materiales/entities/materiale.entity';
import { Sitio } from '../../sitios/entities/sitio.entity';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id_movimiento: number;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @Column({ type: 'float', default: 0 })
  cantidad: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_modificacion: Date;

  @Column({ name: 'usuario_movimiento_id' })
  usuario_movimiento_id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_movimiento_id' })
  usuario: Usuario;

  @Column({ name: 'tipo_movimiento_id' })
  tipo_movimiento_id: number;

  @ManyToOne(() => TipoMovimiento)
  @JoinColumn({ name: 'tipo_movimiento_id' })
  tipo_movimiento: TipoMovimiento;

  @Column({ name: 'material_id', nullable: true })
  material_id: number;

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column({ name: 'sitio_origen_id', nullable: true })
  sitio_origen_id: number;
  
  @ManyToOne(() => Sitio, { nullable: true })
  @JoinColumn({ name: 'sitio_origen_id' })
  sitio_origen: Sitio;
  
  @Column({ name: 'sitio_destino_id', nullable: true })
  sitio_destino_id: number;
  
  @ManyToOne(() => Sitio, { nullable: true })
  @JoinColumn({ name: 'sitio_destino_id' })
  sitio_destino: Sitio;
  
  @Column({ name: 'responsable_id', nullable: true })
  responsable_id: number;
  
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;
  
  @Column({ nullable: true, type: 'text' })
  observaciones: string;
}
