import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './delivery.entity';
import { DeliveryItem } from './delivery-item.entity';
import { DeliveriesService } from './delivery.service';
import { DeliveriesController } from './delivery.controller';
import {CheckpointStockModule} from "../checkpoint-stock/checkpoint-stock.module";
import {CustomerModule} from "../customers/customer.module";
import {OrdersModule} from "../orders/order.module";
import {ProductsModule} from "../products/product.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Delivery, DeliveryItem]),
        CheckpointStockModule,
        CustomerModule,
        forwardRef(() => OrdersModule),
        ProductsModule,
    ],
    exports: [TypeOrmModule],
    providers: [DeliveriesService],
    controllers: [DeliveriesController],
})
export class DeliveriesModule {}
