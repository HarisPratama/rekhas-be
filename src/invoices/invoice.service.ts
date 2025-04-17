import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Order} from "../orders/entities/order.entity";
import {Repository} from "typeorm";
import {Customer} from "../customers/entities/customer.entity";
import {Invoice} from "./entities/invoice.entity";
import {CreateInvoiceDto} from "./shared/dto/create-invoice.dto";
import {Product} from "../products/entities/product.entity";


@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Order) private ordersRepo: Repository<Order>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
        @InjectRepository(Product) private productsRepo: Repository<Product>,
    ) {
    }

    async generateInvoiceNumber() {
        const lastInvoice = await this.invoiceRepo.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        let lastNumber = 0;

        if (lastInvoice && lastInvoice.code) {
            const match = lastInvoice.code.match(/INVOICE-(\d+)/);
            if (match) {
                lastNumber = parseInt(match[1], 10);
            }
        }

        return `INVOICE-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async createInvoice(dto: CreateInvoiceDto) {
        const invoiceNumber = await this.generateInvoiceNumber();

        const invoice = this.invoiceRepo.create({
            code: invoiceNumber,
            order_id: dto.orderId ?? null,
            total_amount: dto.total_amount ?? 0,
            due_date: dto.due_date,
            notes: dto.notes,
            status: 'UNPAID',
        });

        if (dto.customerId) {
            const customer = await this.customerRepo.findOneByOrFail({ id: dto.customerId });
            invoice.customer = customer;
        }

        if (dto.orderId) {
            const order = await this.ordersRepo.findOneByOrFail({ id: dto.orderId });
            invoice.order = order;
        }

        if (dto.productIds && dto.productIds.length > 0) {
            const products = await this.productsRepo.findByIds(dto.productIds);
            invoice.products = products;
        }

        return this.invoiceRepo.save(invoice);
    }


    async updateOrderId(invoiceId: number, orderId: number) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id: invoiceId },
            relations: ['order'],
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        const order = await this.ordersRepo.findOne({
            where: { id: orderId },
            relations: ['customer'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        invoice.order = order;
        invoice.customer = order.customer; // ⬅️ update juga customer-nya

        return this.invoiceRepo.save(invoice);
    }


    async findAll(page: number = 1,
                  limit: number = 10,
                  orderBy: string = 'invoice.created_at',
                  order: 'DESC' | 'ASC' = 'DESC',
                  search: string = '')
    {
        const skip = (page - 1) * limit;

        const queryBuilder = this.invoiceRepo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.customer', 'customer')
            .leftJoinAndSelect('invoice.order', 'order')
            .leftJoinAndSelect('invoice.products', 'products')
            .leftJoinAndSelect('products.checkpointStocks', 'checkpointStock') // ✅ join ke checkpointStocks
            .leftJoinAndSelect('checkpointStock.checkpoint', 'checkpoint');

        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`invoice.${orderBy}`, order);
        }

        // search logic - contoh pakai product name
        if (search) {
            queryBuilder.andWhere(
                `(invoice.name ILIKE :search OR invoice.customer.name ILIKE :search OR invoice.order.code ILIKE :search)`,
                { search: `%${search}%` }
            );
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
        return this.invoiceRepo.findOne({
            where: { id },
            relations: ['customer', 'order'],
        });
    }

    async getAvailableInvoices(productId: number, customerId: number) {
        const query = this.invoiceRepo
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.customer', 'customer')
            .leftJoinAndSelect('invoice.products', 'product')
            .where('invoice.order_id IS NULL')
            .andWhere('product.id = :productId', { productId })
            .andWhere('customer.id = :customerId', { customerId });

        query.orderBy('invoice.created_at', 'DESC');

        return query.getMany();
    }


    async remove(id: number) {
        const invoice = await this.invoiceRepo.findOneBy({ id });
        if (!invoice) throw new NotFoundException('Invoice not found');
        return this.invoiceRepo.remove(invoice);
    }


}
