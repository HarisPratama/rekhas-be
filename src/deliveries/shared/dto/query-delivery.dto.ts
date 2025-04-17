import {IsOptional, IsString, IsNumberString, IsNumber} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDeliveryDto {
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
    type?: 'order_delivery' | 'internal_transfer' = 'order_delivery';

    @IsOptional()
    @IsString()
    orderBy?: string = 'created_at';
}
