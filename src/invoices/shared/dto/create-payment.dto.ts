import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    amount: number;

    @IsNumber()
    invoice_id: number;

    @IsOptional()
    note?: string;
}
