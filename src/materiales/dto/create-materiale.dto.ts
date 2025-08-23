import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateMaterialeDto {
        @IsNotEmpty({ message: 'El código SENA no puede estar vacío.' })
    @IsString({ message: 'El código SENA debe ser una cadena de texto.' })
    codigo_sena: string;

        @IsNotEmpty({ message: 'El nombre del material no puede estar vacío.' })
    @IsString({ message: 'El nombre del material debe ser una cadena de texto.' })
    nombre_material: string;

        @IsNotEmpty({ message: 'La descripción del material no puede estar vacía.' })
    @IsString({ message: 'La descripción del material debe ser una cadena de texto.' })
    descripcion_material: string;

        @IsNotEmpty({ message: 'La unidad de medida no puede estar vacía.' })
    @IsString({ message: 'La unidad de medida debe ser una cadena de texto.' })
    unidad_medida: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de vencimiento debe ser una cadena de fecha válida.' })
    fecha_vencimiento: string;

        @IsNotEmpty({ message: 'El producto perecedero no puede estar vacío.' })
    @IsBoolean({ message: 'El producto perecedero debe ser un valor booleano.' })
    @Type(() => Boolean)
    producto_perecedero: boolean;

        @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
    @IsBoolean({ message: 'El estado debe ser un valor booleano.' })
    @Type(() => Boolean)
    estado: boolean;

        @IsString({ message: 'La imagen debe ser una cadena de texto.' })
    imagen?: string;

        @IsNotEmpty({ message: 'El ID de la categoría no puede estar vacío.' })
    @IsNumber({}, { message: 'El ID de la categoría debe ser un número.' })
    categoria_id: number;

        @IsNotEmpty({ message: 'El ID del tipo de material no puede estar vacío.' })
    @IsNumber({}, { message: 'El ID del tipo de material debe ser un número.' })
    @Type(() => Number)
    tipo_material_id: number;
}
