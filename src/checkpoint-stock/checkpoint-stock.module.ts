import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckpointStock } from './checkpoint-stock.entity';
import { CheckpointStockService } from './checkpoint-stock.service';
import {CheckpointStockController} from "./checkpoint-stock.controller";

@Module({
    imports: [TypeOrmModule.forFeature([CheckpointStock])],
    controllers: [CheckpointStockController],
    providers: [CheckpointStockService],
    exports: [CheckpointStockService, TypeOrmModule],
})
export class CheckpointStockModule {}
