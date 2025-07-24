import { Material } from '../../materiales/entities/materiale.entity';
import { Sitio } from '../../sitios/entities/sitio.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export class UbicacionResponseDto {
  id: number;
  material_id: number;
  sitio_id: number;
  responsable_id?: number | null;
  cantidad: number;
  estado: string;
  ultima_actualizacion: Date;
  material: Material | null;
  sitio: Sitio | null;
  responsable?: Usuario | null;
} 