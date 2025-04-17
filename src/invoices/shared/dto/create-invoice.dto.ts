import {IsArray, IsDateString, IsNumber, IsOptional, IsString} from "class-validator";

export class CreateInvoiceDto {
    @IsNumber()
    customerId: number;

    @IsOptional()
    @IsNumber()
    orderId?: number;

    @IsOptional()
    @IsArray()
    productIds?: number[];

    @IsOptional()
    @IsNumber()
    total_amount?: number;

    @IsOptional()
    @IsDateString()
    due_date?: string;

    @IsOptional()
    @IsString()
    notes: string;
}
