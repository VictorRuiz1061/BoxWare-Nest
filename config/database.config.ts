import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Area } from '../src/areas/entities/area.entity';
import { Centro } from '../src/centros/entities/centro.entity';
import { CategoriaElemento } from '../src/categoria-elementos/entities/categoria-elemento.entity';
import { Ficha } from '../src/fichas/entities/ficha.entity';
import { Material } from '../src/materiales/entities/materiale.entity';
import { Modulo } from '../src/modulos/entities/modulo.entity';
import { Municipio } from '../src/municipios/entities/municipio.entity';
import { Permiso } from '../src/permisos/entities/permiso.entity';
import { Programa } from '../src/programas/entities/programa.entity';
import { Rol } from '../src/roles/entities/role.entity';
import { Sede } from '../src/sedes/entities/sede.entity';
import { Sitio } from '../src/sitios/entities/sitio.entity';
import { TipoMaterial } from '../src/tipo-materiales/entities/tipo-materiale.entity';
import { TipoSitio } from '../src/tipo-sitios/entities/tipo-sitio.entity';
import { TipoMovimiento } from '../src/tipos-movimientos/entities/tipos-movimiento.entity';
import { Usuario } from '../src/usuarios/entities/usuario.entity';
import { Movimiento } from '../src/movimientos/entities/movimiento.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '1065',
  database: process.env.DB_NAME ?? 'boxwareNest',
  entities: [Area, Centro, CategoriaElemento, Ficha, Material, Modulo, Municipio, Permiso, Programa, Rol, Sede, Sitio, TipoMaterial, TipoSitio, TipoMovimiento, Usuario, Movimiento],
  synchronize: true, 
  logging: true,
};
