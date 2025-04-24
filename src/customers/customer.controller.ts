import {Controller, Get, Post, Body, Param, Delete, Put, Query} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import {CreateCustomerMeasurementDto} from "./shared/dto/customer-measurement.dto";
import {instanceToPlain} from "class-transformer";
import {QueryCustomerDto} from "./shared/dto/query-customer.dto";

@Controller('customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @Post()
    create(@Body() data: Partial<Customer>) {
        return this.customerService.create(data);
    }

    @Post(':id/measurements')
    createMeasurement(
        @Param('id') customerId: string,
        @Body() dto: CreateCustomerMeasurementDto
    ) {
        return this.customerService.createMeasurement(Number(customerId), dto);
    }

    @Get()
    findAll(@Query() query: QueryCustomerDto) {
        const { page, limit, order, orderBy, search, type } = query;
        return this.customerService.findAll(Number(page),Number(limit), orderBy, order, search, type);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const customer = await this.customerService.findOne(id);
        return instanceToPlain(customer);
    }

    @Get('measurements/:customerId')
    async getMeasurement(@Param('customerId') customerId: number) {
        const measurement = await this.customerService.getMeasurement(customerId);
        return instanceToPlain(measurement);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: Partial<Customer>) {
        return this.customerService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.customerService.remove(id);
    }
    @Delete('measurement/:id')
    removeMeasurement(@Param('id') id: string) {
        return this.customerService.deleteMeasurement(id);
    }
}
