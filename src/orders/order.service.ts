import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import {Order} from './entities/order.entity';
import {OrderItem} from './entities/order-item.entity';
import {OrderStatus} from "./shared/const/order-status.enum";
import {CartItem} from "../cart/entities/cart-item.entity";
import {Cart} from "../cart/entities/cart.entity";
import {OrderItemImage} from "./entities/order-item-image.entity";
import {CreateOrderDto} from "./shared/dto/create-order.dto";
import {Workshop} from "../workshops/workshop.entity";
import {Invoice} from "../invoices/entities/invoice.entity";
import {InvoiceService} from "../invoices/invoice.service";

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order) private ordersRepo: Repository<Order>,
        @InjectRepository(OrderItem) private orderItemsRepo: Repository<OrderItem>,
        @InjectRepository(OrderItemImage) private orderItemImageRepo: Repository<OrderItemImage>,
        @InjectRepository(Cart) private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
        @InjectRepository(Workshop) private workshopRepo: Repository<Workshop>,
        private readonly dataSource: DataSource,
    ) {}

    async create(orderData: Partial<Order>, items: { productId: number; quantity: number; priceEach: number }[]) {
        const newCode = await this.generateOrderCode();

        const order = this.ordersRepo.create({
            ...orderData,
            code: newCode,
        });
        return this.ordersRepo.save(order).then(savedOrder => {
            const orderItems = items.map(item => {
                return this.orderItemsRepo.create({
                    order: savedOrder,
                    product: { id: item.productId } as any,
                    quantity: item.quantity,
                    price_each: item.priceEach,
                });
            });
            return this.orderItemsRepo.save(orderItems).then(() => savedOrder);
        });
    }

    async generateOrderCode() {
        const lastOrder = await this.ordersRepo.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        let lastNumber = 0;

        if (lastOrder && lastOrder.code) {
            const match = lastOrder.code.match(/ORDER-(\d+)/);
            if (match) {
                lastNumber = parseInt(match[1], 10);
            }
        }

        return `ORDER-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async createOrderFromCart(dto: CreateOrderDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const cart = await queryRunner.manager.findOne(this.cartRepo.target, {
                where: { customer: { id: dto.customerId } },
                relations: ['customer', 'items', 'items.product', 'items.customerMeasurement', 'items.customerMeasurement.images'],
            });

            if (!cart || cart.items.length === 0) {
                throw new NotFoundException('Cart is empty');
            }

            let invoice: Invoice;
            if (dto.invoice_id) {
                invoice = await queryRunner.manager.findOne(Invoice, {
                    where: {
                        id: dto.invoice_id,
                        customer_id: dto.customerId,
                        order_id: null
                    }
                })

                if (!invoice) {
                    throw new NotFoundException('Invoice does not exist');
                }
            }


            const orderCode = await this.generateOrderCode();

            // Generate order items and calculate total amount
            const orderItems: OrderItem[] = [];
            let totalAmount = 0;

            for (const item of cart.items) {
                const priceEach = item.product.price; // pastikan product ada kolom `price`
                const orderItem = this.orderItemsRepo.create({
                    product: item.product,
                    quantity: item.quantity,
                    price_each: priceEach,
                    customerMeasurement: item.customerMeasurement,
                    images: item.customerMeasurement.images.map((img) =>
                        this.orderItemImageRepo.create({ url: img.url })
                    ),
                });

                orderItems.push(orderItem);
                totalAmount += priceEach * item.quantity;
            }

            const order = this.ordersRepo.create({
                code: orderCode,
                customer: cart.customer,
                items: orderItems,
                total_amount: totalAmount,
                status: OrderStatus.PENDING,
                priority: dto.priority, // bisa disesuaikan
                payment_method: dto.payment_method, // bisa disesuaikan
                payment_type: dto.payment_type,
                account_number: dto.account_number,
                bank_name: dto.bank_name,
                due_date: dto.due_date, // atau set default H+X
                sales_id: dto.sales_id, // kalau pakai sales bisa tambahkan salesId
            });

            const savedOrder = await queryRunner.manager.save(order);
            // ✅ Tambahkan Workshop
            // 🔁 Buat workshop berdasarkan OrderItem yang sudah tersimpan
            const savedOrderItems = savedOrder.items;

            const workshops = savedOrderItems.map((item) =>
                this.workshopRepo.create({
                    order: savedOrder,
                    orderItem: item, // 💡 relasi ManyToOne langsung ke OrderItem
                    notes: item.product.type,
                    type: item.product.type,
                    customerMeasurement: item.customerMeasurement,
                })
            );

            await queryRunner.manager.save(workshops);

            // update invoice jika ada
            if (invoice) {
                invoice.total_amount = totalAmount;
                invoice.order_id = savedOrder.id;

                await queryRunner.manager.save(invoice);
            }

            // Clear cart
            await queryRunner.manager.remove(cart.items);
            await queryRunner.manager.remove(cart);

            await queryRunner.commitTransaction();
            return savedOrder;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    findAll() {
        return this.ordersRepo.find({
            relations: ['customer', 'sales', 'items', 'items.product'], // 👈 include nested relation
        });
    }

    async findAllByType(
        page: number = 1,
        limit: number = 10,
        orderBy: string = 'order.created_at',
        order: 'DESC' | 'ASC' = 'DESC',
        type?: 'transaction' | 'customer' | 'items' | null,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.ordersRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.sales', 'sales')
            .leftJoinAndSelect('order.invoice', 'invoice')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product')

        const orderColumns = ['created_at', 'updated_at', 'code', 'id'];

        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');

            if (alias === 'product') {
                queryBuilder.orderBy(`product.${field}`, order || 'DESC');
            } else if (alias === 'order') {
                queryBuilder.orderBy(`order.${field}`, order || 'DESC');
            } else {
                queryBuilder.orderBy(orderBy, order || 'DESC');
            }
        } else if (orderColumns.includes(orderBy)) {
            queryBuilder.orderBy(`order.${orderBy}`, order || 'DESC');
        } else {
            queryBuilder.orderBy(`order.created_at`, order || 'DESC');
        }

        if (search.length > 0) {
            queryBuilder.andWhere(
                `(
                    order.code ILIKE :search OR 
                    product.name ILIKE :search OR 
                    product.code ILIKE :search OR 
                    product.fabric ILIKE :search OR 
                    sales.name ILIKE :search OR 
                    customer.name ILIKE :search
                )`,
                { search: `%${search}%` }
            );
        }

        const [orders, total] = await queryBuilder.getManyAndCount();

        return {
            data: orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async fecthOneByID(id: number) {
        const queryBuilder = this.ordersRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.invoice', 'invoice')
            .leftJoinAndSelect('order.sales', 'sales')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'products')
            .leftJoinAndSelect('items.workshops', 'workshops')
            .where('order.id = :id', { id })
        const order = await queryBuilder.getOne();

        if (!order) {
            throw new NotFoundException(`Delivery with id ${id} not found`);
        }

        return order;
    }

    async updateStatus(id: number, status: OrderStatus) {
        const order = await this.ordersRepo.findOneBy({ id });
        if (!order) throw new NotFoundException('Order not found');

        order.status = status;
        return this.ordersRepo.save(order);
    }

}
