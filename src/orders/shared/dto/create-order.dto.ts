import {IsDate, IsEnum, IsNumber, IsOptional, IsString} from "class-validator";
import {OrderPriorityEnum} from "../const/order-priority.enum";
import {OrderPaymentMethod, OrderPaymentType} from "../const/order-payment-type.enum";
import {OrderStatus} from "../const/order-status.enum";
import {Transform} from "class-transformer";

export class CreateOrderDto {
    @IsNumber()
    customerId: number;

    @IsEnum(OrderPriorityEnum)
    priority: OrderPriorityEnum;

    @IsEnum(OrderPaymentMethod)
    payment_method: OrderPaymentMethod;

    @IsEnum(OrderPaymentType)
    payment_type: OrderPaymentType;

    @IsOptional()
    @IsEnum(OrderStatus)
    status: OrderStatus

    @IsOptional()
    @IsString()
    account_number: string;

    @IsOptional()
    @IsString()
    bank_name: string;

    @Transform(({ value }) => new Date(value))
    @IsDate()
    due_date: Date;

    @IsOptional()
    @IsNumber()
    sales_id: number;

    @IsOptional()
    @IsNumber()
    invoice_id: number;
}
