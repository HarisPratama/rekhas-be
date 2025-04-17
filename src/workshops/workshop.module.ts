import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Workshop} from "./workshop.entity";
import {WorkshopsController} from "./workshop.controller";
import {WorkshopService} from "./workshop.service";
import {OrdersModule} from "../orders/order.module";
import {UserModule} from "../users/user.module";
import {DeliveriesModule} from "../deliveries/delivery.module";
import {CheckpointStockModule} from "../checkpoint-stock/checkpoint-stock.module";


@Module({
    imports: [
        TypeOrmModule.forFeature([Workshop]),
        forwardRef(() => OrdersModule),
        UserModule,
        DeliveriesModule,
        CheckpointStockModule
    ],
    providers: [WorkshopService],
    controllers: [WorkshopsController],
    exports: [TypeOrmModule],
})
export class WorkShopModule {}
