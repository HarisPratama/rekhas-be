import {Transform, Type} from 'class-transformer';
import {ValidateNested, IsNumber, IsBoolean, IsOptional, IsArray, IsDateString, IsDate} from 'class-validator';

class DeliveryItemDto {
    @IsNumber()
    product_id: number;

    @IsNumber()
    quantity_delivered: number;
}

export class CreateInternalTransferDto {
    @IsNumber()
    from_id: number;

    @IsNumber()
    to_id: number;

    @Transform(({ value }) => new Date(value))
    @IsDate()
    scheduled_at: Date;

    @IsNumber()
    courier_id: number;

    @IsOptional()
    note?: string;

    @IsOptional()
    @IsBoolean()
    is_priority?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DeliveryItemDto)
    items: DeliveryItemDto[];
}
