import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './product.service';
import { ProductsController } from './product.controller';
import {CheckpointStockModule} from "../checkpoint-stock/checkpoint-stock.module";
import {CheckpointModule} from "../checkpoints/checkpoint.module";
import {ProductImage} from "./entities/product-image.entity";
import {ProductSizeMeasurement} from "./entities/product-size-measurement.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, ProductImage, ProductSizeMeasurement]),
        CheckpointModule,
        CheckpointStockModule
    ],
    providers: [ProductsService],
    controllers: [ProductsController],
    exports: [TypeOrmModule]
})
export class ProductsModule {}
