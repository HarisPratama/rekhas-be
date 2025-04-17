import {IsNumber, IsOptional} from "class-validator";

export class CreateCustomerMeasurementDto {
    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    waist?: number;

    @IsOptional()
    @IsNumber()
    chest?: number;

    @IsOptional()
    @IsNumber()
    collar?: number;

    @IsOptional()
    @IsNumber()
    shoulder?: number;

    @IsOptional()
    @IsNumber()
    sleeveLength?: number;

    @IsOptional()
    @IsNumber()
    upperSleeveRim?: number;

    @IsOptional()
    @IsNumber()
    lowerSleeveRim?: number;

    @IsOptional()
    @IsNumber()
    thigh?: number;

    @IsOptional()
    @IsNumber()
    knee?: number;

    @IsOptional()
    @IsNumber()
    foot?: number;

    @IsOptional()
    @IsNumber()
    hip?: number;

    @IsOptional()
    @IsNumber()
    armLength?: number;

    @IsOptional()
    @IsNumber()
    cuff?: number;

    @IsOptional()
    @IsNumber()
    kriss?: number;
}
