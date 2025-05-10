import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { PermisosModule } from './permisos/permisos.module';
import { ModulosModule } from './modulos/modulos.module';
import { MunicipiosModule } from './municipios/municipios.module';
import { CentrosModule } from './centros/centros.module';
import { SedesModule } from './sedes/sedes.module';
import { AreasModule } from './areas/areas.module';
import { ProgramasModule } from './programas/programas.module';
import { TipoSitiosModule } from './tipo-sitios/tipo-sitios.module';
import { SitiosModule } from './sitios/sitios.module';
import { TiposMovimientoModule } from './tipos-movimientos/tipos-movimientos.module';
import { MovimientosModule } from './movimientos/movimientos.module';
import { FichasModule } from './fichas/fichas.module';
import { CategoriaElementosModule } from './categoria-elementos/categoria-elementos.module';
import { TipoMaterialesModule } from './tipo-materiales/tipo-materiales.module';
import { MaterialesModule } from './materiales/materiales.module';
import { databaseConfig } from 'config/database.config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'env/.env'
    }),
    TypeOrmModule.forRoot(databaseConfig),
    UsuariosModule, RolesModule, PermisosModule, ModulosModule, MunicipiosModule, CentrosModule,
    SedesModule, AreasModule, ProgramasModule, TipoSitiosModule, SitiosModule, TiposMovimientoModule,
    MovimientosModule, FichasModule, CategoriaElementosModule, TipoMaterialesModule, MaterialesModule,AuthModule

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
