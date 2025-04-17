import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Delivery} from './delivery.entity';
import {DeliveryItem} from './delivery-item.entity';
import {DeliveryStatus} from "./shared/const/delivery-status.enum";
import {CheckpointStockService} from "../checkpoint-stock/checkpoint-stock.service";
import {Customer} from "../customers/entities/customer.entity";
import {CreateInternalTransferDto} from "./shared/dto/create-internal-transfer.dto";
import {Checkpoint} from "../checkpoints/checkpoint.entity";
import {Order} from "../orders/entities/order.entity";
import {OrderStatus} from "../orders/shared/const/order-status.enum";

@Injectable()
export class DeliveriesService {
    constructor(
        @InjectRepository(Order) private orderRepo: Repository<Order>,
        @InjectRepository(Delivery) private deliveriesRepo: Repository<Delivery>,
        @InjectRepository(DeliveryItem) private deliveryItemsRepo: Repository<DeliveryItem>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        private readonly stockService: CheckpointStockService
    ) {}

    async generateDeliveryCode() {
        const lastDelivery = await this.deliveriesRepo.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        let lastNumber = 0;

        if (lastDelivery && lastDelivery.code) {
            const match = lastDelivery.code.match(/DELIVERY-(\d+)/);

            if (match) {
                lastNumber = parseInt(match[1], 10);
            }
        }

        return `DELIVERY-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async createCustomerDelivery(deliveryData: Partial<Delivery>, items: { orderItemId: number; quantityDelivered: number }[]) {
        const newCode = await this.generateDeliveryCode();

        if (deliveryData.to_type === 'customer' && !deliveryData.order_id) {
            throw new BadRequestException('Order ID is required when delivering to customer');
        }

        const delivery = this.deliveriesRepo.create({
            ...deliveryData,
            code: newCode,
            type: 'order_delivery',
            to_type: 'customer',
            status: DeliveryStatus.SCHEDULED,
        });

        // Buat entity delivery item berdasarkan orderItemId
        delivery.items = items.map(item => {
            const deliveryItem = new DeliveryItem();
            deliveryItem.orderItem = { id: item.orderItemId } as any;
            deliveryItem.quantity_delivered = item.quantityDelivered;
            return deliveryItem;
        });

        return this.deliveriesRepo.save(delivery);
    }

    async createInternalTransfer(dto: CreateInternalTransferDto) {
        const deliveryCode = await this.generateDeliveryCode(); // ex: DELIVERY-000012
        const delivery = this.deliveriesRepo.create({
            from_id: dto.from_id,
            to_id: dto.to_id,
            scheduled_at: dto.scheduled_at,
            courier_id: dto.courier_id,
            note: dto.note,
            is_priority: dto.is_priority,
            code: deliveryCode,
            type: 'internal_transfer',
            to_type: 'checkpoint',
            status: DeliveryStatus.SCHEDULED,
        });

        delivery.items = dto.items.map((item) => {
            const deliveryItem = new DeliveryItem();
            deliveryItem.product = { id: item.product_id } as any;
            deliveryItem.quantity_delivered = item.quantity_delivered;
            return deliveryItem;
        });

        return this.deliveriesRepo.save(delivery);
    }


    findAll() {
        return this.deliveriesRepo.find({ relations: ['courier', 'items', 'items.orderItem', 'items.orderItem.order', 'items.orderItem.product'] });
    }

    async findAllByType(
        page: number = 1,
        limit: number = 10,
        orderBy: string = 'delivery.created_at',
        order: 'DESC' | 'ASC' = 'DESC',
        type: 'order_delivery' | 'internal_transfer' = 'order_delivery',
        search: string = ''
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.deliveriesRepo
            .createQueryBuilder('delivery')
            .leftJoinAndSelect('delivery.courier', 'courier')
            .leftJoinAndSelect('delivery.items', 'items')
            .leftJoinAndSelect('delivery.from', 'from')
            .leftJoinAndSelect('items.orderItem', 'orderItem')
            .leftJoinAndSelect('orderItem.order', 'order')
            .leftJoinAndSelect('orderItem.product', 'product')

        if (type === 'internal_transfer') {
            queryBuilder
                .leftJoinAndMapOne(
                    'delivery.to_checkpoint',
                    Checkpoint,
                    'checkpoint',
                    'checkpoint.id = delivery.to_id AND delivery.to_type = :checkpointType',
                    { checkpointType: 'checkpoint' },
                )
        } else {
            queryBuilder
                .leftJoinAndMapOne(
                    'delivery.to_customer',
                    Customer,
                    'customer',
                    'customer.id = delivery.to_id AND delivery.to_type = :customerType',
                    { customerType: 'customer' },
                )
        }
        queryBuilder
            .where('delivery.type = :type', { type })
            .skip(skip)
            .take(limit);

        // ordering logic
        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`delivery.${orderBy}`, order);
        }

        // search logic - contoh pakai product name
        if (search.length > 0) {
            queryBuilder.andWhere('product.name ILIKE :search', { search: `%${search}%` });
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOneById(id: number) {
        const queryBuilder = this.deliveriesRepo
            .createQueryBuilder('delivery')
            .leftJoinAndSelect('delivery.courier', 'courier')
            .leftJoinAndSelect('delivery.items', 'items')
            .leftJoinAndSelect('delivery.from', 'from')
            .leftJoinAndSelect('items.orderItem', 'orderItem')
            .leftJoinAndSelect('items.product', 'products')
            .leftJoinAndSelect('orderItem.order', 'order')
            .leftJoinAndSelect('orderItem.product', 'product');

        // load to (customer/checkpoint) dynamically
        queryBuilder
            .leftJoinAndMapOne(
                'delivery.to_checkpoint',
                Checkpoint,
                'checkpoint',
                'checkpoint.id = delivery.to_id AND delivery.to_type = :checkpointType',
                { checkpointType: 'checkpoint' },
            )
            .leftJoinAndMapOne(
                'delivery.to_customer',
                Customer,
                'customer',
                'customer.id = delivery.to_id AND delivery.to_type = :customerType',
                { customerType: 'customer' },
            );

        queryBuilder.where('delivery.id = :id', { id });

        const delivery = await queryBuilder.getOne();

        if (!delivery) {
            throw new NotFoundException(`Delivery with id ${id} not found`);
        }

        return delivery;
    }

    async updateStatus(id: number, status: DeliveryStatus) {
        const delivery = await this.deliveriesRepo.findOneBy({ id });
        if (!delivery) throw new NotFoundException('Delivery not found');

        delivery.status = status;
        return this.deliveriesRepo.save(delivery);
    }

    async uploadProofAndAdjustStock(deliveryId: number, filename: string) {
        const findDelivery = await this.findOneById(deliveryId);
        let relations = ['from', 'items']
        if (findDelivery.type === 'internal_transfer') relations = [...relations, 'items.product']
        else if (findDelivery.type === 'order_delivery') relations = [...relations, 'items.orderItem', 'items.orderItem.product', 'order']

        const delivery = await this.deliveriesRepo.findOne({
            where: { id: deliveryId },
            relations, // 🚫 removed 'to'
        });

        if (!delivery) throw new NotFoundException('Delivery not found');

        // Save proof image
        delivery.proof_image_url = `/uploads/proofs/${filename}`;

        // If not delivered yet, adjust stock
        if (delivery.status !== DeliveryStatus.DELIVERED) {
            for (const item of delivery.items) {
                const product = delivery.type === 'internal_transfer'
                    ? item.product
                    : item.orderItem?.product;

                if (!product) continue;

                // Deduct from source
                await this.stockService.adjustStock(delivery.from.id, product.id, -item.quantity_delivered);

                // If internal transfer, add to destination
                if (delivery.type === 'internal_transfer') {
                    await this.stockService.adjustStock(delivery.to_id, product.id, item.quantity_delivered);
                }
            }

            // ✅ Update customer data if to_type is customer
            if (delivery.to_type === 'customer') {
                const customer = await this.customerRepo.findOne({
                    where: { id: delivery.to_id },
                });

                if (customer) {
                    let deliveryRevenue = 0;
                    let totalItems = 0;

                    for (const item of delivery.items) {
                        const product = item.orderItem.product;
                        deliveryRevenue += Number(product.price) * item.quantity_delivered;
                        totalItems += item.quantity_delivered;
                    }

                    customer.num_of_orders += 1;
                    customer.num_of_items += totalItems;
                    customer.revenue += deliveryRevenue;

                    await this.customerRepo.save(customer);
                }
            }

            // Update status delivery
            delivery.status = DeliveryStatus.DELIVERED;
            await this.deliveriesRepo.save(delivery);

            // ✅ Cek apakah semua delivery dari order ini sudah selesai
            if (delivery.order) {
                const relatedDeliveries = await this.deliveriesRepo.find({
                    where: { order: { id: delivery.order.id } },
                });

                const allDelivered = relatedDeliveries.every(d => d.status === DeliveryStatus.DELIVERED);

                if (allDelivered) {
                    await this.orderRepo.update(delivery.order.id, {
                        status: OrderStatus.COMPLETED,
                    });
                }
            }
        }

        return delivery;
    }



}
