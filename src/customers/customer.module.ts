import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import {CustomerMeasurement} from "./entities/customer-measurement.entity";
import {CustomerMeasurementImage} from "./entities/customer-measurement-image";

@Module({
    imports: [TypeOrmModule.forFeature([Customer, CustomerMeasurement, CustomerMeasurementImage])],
    controllers: [CustomerController],
    providers: [CustomerService],
    exports: [TypeOrmModule],
})
export class CustomerModule {}
