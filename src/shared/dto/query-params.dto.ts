import {IsOptional, IsString, IsNumberString, IsNumber} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryParamsDto {
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
    type?: 'REGULAR' | 'READY-TO-WEAR' | 'COLLECTION' | '' = '';

    @IsOptional()
    @IsString()
    orderBy?: string = 'created_at';

    @IsOptional()
    @IsString()
    role?: string = '';
}
