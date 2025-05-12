import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Material } from './materiale.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  @ManyToOne(() => Material,(material) => material.imagen,)
  material: Material;
}
