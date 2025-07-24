import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tipos_movimiento')
export class TipoMovimiento {
  @PrimaryGeneratedColumn()
  id_tipo_movimiento: number;

  @Column({ length: 255 })
  tipo_movimiento: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_modificacion: Date;
}
 