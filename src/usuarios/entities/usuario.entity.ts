import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from '../../roles/entities/role.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 150 })
  apellido: string;

  @Column()
  edad: number;

  @Column({ length: 60 })
  cedula: string;

  @Column({ length: 254 })
  email: string;

  @Column()
  contrasena: string;

  @Column({ length: 255 })
  telefono: string;

  @Column('text', { nullable: true })
  imagen: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;  

  @CreateDateColumn()
  fecha_registro: Date;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ name: 'rol_id' })
  rol_id: number;
}
