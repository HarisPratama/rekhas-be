import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ProductsModule} from "./products/product.module";
import {OrdersModule} from "./orders/order.module";
import {DeliveriesModule} from "./deliveries/delivery.module";
import {CheckpointModule} from "./checkpoints/checkpoint.module";
import {CustomerModule} from "./customers/customer.module";
import {UserModule} from "./users/user.module";
import {RoleModule} from "./roles/role.module";
import {CheckpointStockModule} from "./checkpoint-stock/checkpoint-stock.module";
import {WorkShopModule} from "./workshops/workshop.module";
import {InvoiceModule} from "./invoices/invoice.module";
import {CartModule} from "./cart/cart.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'rekhas',
      autoLoadEntities: true,
      synchronize: true,
    }),
      ProductsModule,
      OrdersModule,
      DeliveriesModule,
      CheckpointModule,
      CheckpointStockModule,
      CustomerModule,
      UserModule,
      RoleModule,
      InvoiceModule,
      WorkShopModule,
      CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
