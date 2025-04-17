import {IsOptional, IsString, IsNumberString, IsNumber} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    order?: 'DESC' | 'ASC' = 'DESC';

    @IsOptional()
    @IsString()
    search?: string = '';

    @IsOptional()
    @IsString()
    role?: 'TAILOR' | 'CUTTER' | 'SALES' | 'DIRECTOR' | 'COURIER' | 'OFFICE' | '' = '';

    @IsOptional()
    @IsString()
    orderBy?: string = 'id';
}
