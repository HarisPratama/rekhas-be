import {Controller, Post, Body, Get, Query, Param} from '@nestjs/common';
import { OrdersService } from './order.service';
import {QueryOrderDto} from "./shared/dto/query-order.dto";
import {CreateOrderDto} from "./shared/dto/create-order.dto";
import {instanceToPlain} from "class-transformer";

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    create(@Body() body: any) {
        return this.ordersService.create(body.order, body.items);
    }

    @Post('checkout')
    createOrder(@Body() body: CreateOrderDto) {
        return this.ordersService.createOrderFromCart(body);
    }

    @Get()
    findAll(@Query() query: QueryOrderDto) {
        const { page, limit, order, orderBy, type, search } = query;
        return this.ordersService.findAllByType(page, limit, orderBy, order, type, search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const order = await this.ordersService.fecthOneByID(Number(id));
        return instanceToPlain(order)
    }
}
