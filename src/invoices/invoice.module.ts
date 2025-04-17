import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Invoice} from "./entities/invoice.entity";
import {InvoiceController} from "./invoice.controller";
import {InvoiceService} from "./invoice.service";
import {OrdersModule} from "../orders/order.module";
import {CustomerModule} from "../customers/customer.module";
import {ProductsModule} from "../products/product.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice]),
        OrdersModule,
        CustomerModule,
        ProductsModule,
    ],
    providers: [InvoiceService],
    controllers: [InvoiceController],
    exports: [TypeOrmModule],
})
export class InvoiceModule {}
