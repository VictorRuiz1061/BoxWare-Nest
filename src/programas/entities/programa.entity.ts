import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Area } from '../../areas/entities/area.entity';
import { Ficha } from '../../fichas/entities/ficha.entity';

@Entity('programas')
export class Programa {
  @PrimaryGeneratedColumn()
  id_programa: number;

  @Column({ length: 100 })
  nombre_programa: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_modificacion: Date;

  @ManyToOne(() => Area, area => area.programas)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToMany(() => Ficha, ficha => ficha.programa)
  fichas: Ficha[];
}