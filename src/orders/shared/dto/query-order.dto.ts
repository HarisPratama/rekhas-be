import {IsOptional, IsString, IsNumberString, IsNumber} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOrderDto {
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
    orderBy?: string = 'created_at';

    @IsOptional()
    @IsString()
    search?: string = '';

    @IsOptional()
    @IsString()
    type?: 'transaction' | 'customer' | 'items' | null = null;
}
