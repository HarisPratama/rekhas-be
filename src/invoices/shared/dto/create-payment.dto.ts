import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    amount: number;

    @IsEnum(['PARTIAL', 'FULL'])
    type: 'PARTIAL' | 'FULL';

    @IsNumber()
    invoice_id: number;

    @IsOptional()
    note?: string;
}
