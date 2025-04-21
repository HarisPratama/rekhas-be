import {Controller, Get, Param, ParseIntPipe, Query} from '@nestjs/common';
import { CheckpointStockService } from './checkpoint-stock.service';
import {instanceToPlain, plainToInstance} from "class-transformer";
import {CheckpointStock} from "./checkpoint-stock.entity";
import {QueryCheckpointstockDto} from "./shared/dto/checkpoint-stock-query.dto";

@Controller('checkpoint-stocks')
export class CheckpointStockController {
    constructor(private readonly stockService: CheckpointStockService) {}

    @Get()
    async findAll(@Query() query: QueryCheckpointstockDto) {
        const { page, limit, order, orderBy, search, type } = query;

        const stocks = await this.stockService.findAllWithRelations(Number(page), Number(limit), orderBy, order, search, type);
        return instanceToPlain(stocks);
    }

    @Get('checkpoint/:id')
    async findByCheckpoint(@Query() query: QueryCheckpointstockDto, @Param('id', ParseIntPipe) id: number) {
        const { page, limit, order, orderBy, search, type } = query;

        const stocks = this.stockService.findByCheckpoint(id, Number(page), Number(limit), orderBy, order, search, type);
        return instanceToPlain(stocks);
    }
}
