import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Material } from '../../materiales/entities/materiale.entity';
import { Sitio } from '../../sitios/entities/sitio.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('ubicaciones_actuales')
export class UbicacionActual {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  material_id: number;

  @ManyToOne(() => Material)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @Column()
  sitio_id: number;

  @ManyToOne(() => Sitio)
  @JoinColumn({ name: 'sitio_id' })
  sitio: Sitio;

  @Column({ nullable: true, type: 'int' })
  responsable_id?: number | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;

  @Column('float')
  cantidad: number;

  @Column({ length: 50 })
  estado: string;

  @UpdateDateColumn()
  ultima_actualizacion: Date;
} 