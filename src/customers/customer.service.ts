import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Customer} from './entities/customer.entity';
import {CreateCustomerMeasurementDto} from "./shared/dto/customer-measurement.dto";
import {CustomerMeasurement} from "./entities/customer-measurement.entity";
import {nanoid} from "nanoid";

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(CustomerMeasurement)
        private readonly measurementRepo: Repository<CustomerMeasurement>,
    ) {}

    async create(data: Partial<Customer>) {
        // Check if email already exists
        const existingEmail = await this.customerRepo.findOne({ where: { email: data.email } });
        if (existingEmail) {
            throw new BadRequestException(`Customer with email ${data.email} already exists`);
        }

        if (data.phone[0] !== '6' || data.phone[1] !== '2') {
            if (data.phone[0] === '0') {
                data.phone = data.phone.slice(1);
            }
            data.phone = '+62' + data.phone;
        }

        // Check if phone number already exists
        const existingPhone = await this.customerRepo.findOne({ where: { phone: data.phone } });
        if (existingPhone) {
            throw new BadRequestException(`Customer with phone number ${data.phone} already exists`);
        }
        const newCode = await this.generateCustomerCode();

        const customer = this.customerRepo.create({
            ...data,
            code: newCode,
        });
        return this.customerRepo.save(customer);
    }

    async generateCustomerCode() {
        const lastCustomer = await this.customerRepo.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        let lastNumber = 0;

        if (lastCustomer && lastCustomer.code) {
            const match = lastCustomer.code.match(/CUST-(\d+)/);

            if (match) {
                lastNumber = parseInt(match[1], 10);
            }
        }

        return `CUST-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async createMeasurement(customerId: number, dto: CreateCustomerMeasurementDto) {
        const customer = await this.customerRepo.findOneOrFail({ where: { id: customerId } });

        // Generate unique code, bisa juga diganti timestamp kalau lebih suka
        const uniqueCode = `PATTERN-${customerId}-${nanoid(6)}`;

        const measurement = this.measurementRepo.create({
            ...dto,
            customer,
            code: uniqueCode,
        });

        return await this.measurementRepo.save(measurement);
    }

    async getMeasurement(customerId: number) {
        const customer = await this.customerRepo.findOneOrFail({ where: { id: customerId } });
        return await this.measurementRepo.find({
            where: {customer},
            relations: ['images'],
        });
    }

    deleteMeasurement(id: string) {
        return this.measurementRepo.delete(id);
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        orderBy: string = 'delivery.created_at',
        order: 'DESC' | 'ASC' = 'DESC',
        search: string = '',
        type: string = ''
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.customerRepo
            .createQueryBuilder('customer');

        if (type === 'list') {
            queryBuilder
                .leftJoin('customer.orders', 'orders')
                .leftJoin(
                    'orders.invoice',
                    'invoice',
                    'invoice.status != :completedStatus',
                    { completedStatus: 'PAID' }
                )
                .addSelect('COALESCE(SUM(CAST(invoice.total_amount AS numeric)), 0)', 'customer_outstanding')
                .groupBy('customer.id')
        }

        if (search.length > 0) {
            queryBuilder.andWhere('' +
                'customer.name ILIKE :search OR ' +
                'customer.address ILIKE :search', { search: `%${search}%` })
        }

        queryBuilder
            .skip(skip)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        const queryBuilder = this.customerRepo
            .createQueryBuilder('customer')
            .leftJoin('customer.orders', 'orders')
            .leftJoin('orders.invoice', 'invoice')
            .where('customer.id', {id})
        const customer = await queryBuilder.getOne();

        if (!customer) {
            throw new NotFoundException(`customer with id ${id} not found`);
        }

        return customer;
    }

    update(id: number, data: Partial<Customer>) {
        return this.customerRepo.update(id, data);
    }

    remove(id: number) {
        return this.customerRepo.delete(id);
    }
}
