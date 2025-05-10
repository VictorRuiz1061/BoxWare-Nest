import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMaterialeDto {
    @IsNotEmpty()
    @IsString()
    codigo_sena: string;

    @IsNotEmpty()
    @IsString()
    nombre_material: string;

    @IsNotEmpty()
    @IsString()
    descripcion_material: string;

    @IsNotEmpty()
    @IsNumber()
    stock: number;

    @IsNotEmpty()
    @IsString()
    unidad_medida: string;

    @IsNotEmpty()
    @IsString()
    fecha_vencimiento: string;

    @IsNotEmpty()
    @IsBoolean()
    producto_perecedero: boolean;

    @IsNotEmpty()
    @IsBoolean()
    estado: boolean;

    @IsString()
    imagen?: string;

    @IsNotEmpty()
    @IsString()
    fecha_creacion: string;

    @IsNotEmpty()
    @IsString()
    fecha_modificacion: string;

    @IsNotEmpty()
    @IsNumber()
    id_categoria: number;

    @IsNotEmpty()
    @IsNumber()
    id_tipo_material: number;

    @IsNotEmpty()
    @IsNumber()
    id_sitio: number;

}
