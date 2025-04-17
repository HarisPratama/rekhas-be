import {IsOptional, IsString, IsNumberString, IsNumber} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCheckpointstockDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 5;

    @IsOptional()
    @IsString()
    order?: 'DESC' | 'ASC' = 'DESC';

    @IsOptional()
    @IsString()
    type?: 'REGULAR' | 'COLLECTION' | 'READY-TO-WEAR';

    @IsOptional()
    @IsString()
    orderBy?: string = 'stock.created_at';

    @IsOptional()
    @IsString()
    search?: string = '';
}
