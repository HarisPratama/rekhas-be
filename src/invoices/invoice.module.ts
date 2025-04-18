import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Invoice} from "./entities/invoice.entity";
import {InvoiceController} from "./invoice.controller";
import {InvoiceService} from "./invoice.service";
import {OrdersModule} from "../orders/order.module";
import {CustomerModule} from "../customers/customer.module";
import {ProductsModule} from "../products/product.module";
import {WorkShopModule} from "../workshops/workshop.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice]),
        CustomerModule,
        ProductsModule,
        forwardRef(() => OrdersModule),
        forwardRef(() => WorkShopModule)
    ],
    providers: [InvoiceService],
    controllers: [InvoiceController],
    exports: [TypeOrmModule, InvoiceService],
})
export class InvoiceModule {}
