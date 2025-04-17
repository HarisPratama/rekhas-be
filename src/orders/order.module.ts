import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';
import {OrderItemImage} from "./entities/order-item-image.entity";
import {CartModule} from "../cart/cart.module";
import {WorkShopModule} from "../workshops/workshop.module";
import {DeliveriesModule} from "../deliveries/delivery.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, OrderItemImage]),
        CartModule,
        forwardRef(() => WorkShopModule),
        forwardRef(() => DeliveriesModule),
    ],
    providers: [OrdersService],
    controllers: [OrdersController],
    exports: [TypeOrmModule]
})
export class OrdersModule {}
