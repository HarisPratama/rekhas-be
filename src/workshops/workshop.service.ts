import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {DataSource, QueryRunner, Repository} from 'typeorm';
import { Workshop } from './workshop.entity';
import { WorkshopStatus } from './shared/const/workshop-status.enum';
import { Order } from '../orders/entities/order.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { DeliveryItem } from '../deliveries/delivery-item.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { DeliveryStatus } from '../deliveries/shared/const/delivery-status.enum';
import {User} from "../users/user.entity";
import {CheckpointStock} from "../checkpoint-stock/checkpoint-stock.entity";
import {OrderStatus} from "../orders/shared/const/order-status.enum";

@Injectable()
export class WorkshopService {
    constructor(
        @InjectRepository(Workshop) private readonly workshopRepo: Repository<Workshop>,
        @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Delivery) private readonly deliveryRepo: Repository<Delivery>,
        @InjectRepository(DeliveryItem) private readonly deliveryItemRepo: Repository<DeliveryItem>,
        @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
        @InjectRepository(CheckpointStock) private readonly checkpointStockRepo: Repository<CheckpointStock>,
        private readonly dataSource: DataSource,
    ) {}

    // existing methods...

    async scheduleDelivery(workshopId: number, courierId: number, scheduledDate: Date, note: string, address: string, isPriority:boolean) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const workshop = await this.getWorkshopOrThrow(workshopId, queryRunner);
            this.ensureWorkshopReady(workshop);

            const order = await this.getOrderOrThrow(workshop.order_id, queryRunner);
            const courier = await this.getCourierOrThrow(courierId, queryRunner);
            const deliveryCode = await this.generateNextDeliveryCode(queryRunner);

            const orderItem = this.getOrderItemForWorkshop(order, workshop.product_id);
            const fromCheckpointId = await this.findCheckpointWithStockOrThrow(orderItem, queryRunner);

            const delivery = queryRunner.manager.create(Delivery, {
                code: deliveryCode,
                type: 'order_delivery',
                order_id: order.id,
                courier_id: courier.id,
                from_id: fromCheckpointId,
                to_type: 'customer',
                to_id: order.customer_id,
                scheduled_at: scheduledDate,
                note,
                status: DeliveryStatus.SCHEDULED,
                is_priority: isPriority ?? false,
            });

            const savedDelivery = await queryRunner.manager.save(delivery);

            const deliveryItemAddress = address ?? order.customer.address;
            await this.createDeliveryItems(savedDelivery, [orderItem], deliveryItemAddress, queryRunner);
            await this.markWorkshopAsCompleted(workshop, scheduledDate, queryRunner);

            await queryRunner.commitTransaction();
            return savedDelivery;

        } catch (error) {
            console.error('Failed to schedule delivery:', error)
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    async getWorkshopProducts(workshopId: number) {
        const workshop = await this.workshopRepo.findOne({
            where: { id: workshopId },
            relations: ['order', 'order.items', 'order.items.product'],
        });
        if (!workshop) throw new NotFoundException('Workshop not found');

        return workshop.order.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
        }));
    }

    async findAll(
        page = 1,
        limit = 10,
        orderBy: string = 'workshop.updated_at',
        order: 'ASC' | 'DESC' = 'DESC',
        search: string = ''
    ) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.workshopRepo
            .createQueryBuilder('workshop')
            .leftJoinAndSelect('workshop.order', 'order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('workshop.product', 'product')
            .skip(skip)
            .take(limit);

        if (search) {
            queryBuilder.andWhere('workshop.name ILIKE :search', { search: `%${search}%` });
        }

        if (orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`workshop.${orderBy}`, order);
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

    findOne(id: number) {
        return this.workshopRepo.findOne(
            {
                where: { id },
                relations: ['order', 'order.customer', 'product', 'tailor', 'cutter', 'customerMeasurement'],
            }
        );
    }

    async assignWorkers(workshopId: number, payload: { tailorId?: number; cutterId?: number }) {
        const workshop = await this.workshopRepo.findOne({ where: { id: workshopId } });

        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        if (payload.tailorId) {
            workshop.tailor_id = payload.tailorId;
        }

        if (payload.cutterId) {
            workshop.cutter_id = payload.cutterId;
        }

        workshop.status = WorkshopStatus.READY;
        return await this.workshopRepo.save(workshop);
    }

    async updateStatus(id: number, status: WorkshopStatus) {
        const order = await this.workshopRepo.findOneBy({ id });
        if (!order) throw new NotFoundException('Workshop not found');

        order.status = status;
        return this.workshopRepo.save(order);
    }

//     helper
    private async getWorkshopOrThrow(id: number, qr: QueryRunner) {
        const workshop = await qr.manager.findOne(Workshop, {
            where: { id },
            relations: ['order', 'order.customer'],
        });
        if (!workshop) throw new NotFoundException('Workshop not found');
        return workshop;
    }

    private ensureWorkshopReady(workshop: Workshop) {
        if (!workshop.tailor_id || !workshop.cutter_id) {
            throw new BadRequestException('Workshop must be assigned to both tailor and cutter before scheduling delivery');
        }
    }

    private async getOrderOrThrow(orderId: number, qr: QueryRunner) {
        const order = await qr.manager.findOne(Order, {
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });
        if (!order) throw new BadRequestException('Order not found for this workshop');
        return order;
    }

    private async getCourierOrThrow(courierId: number, qr: QueryRunner) {
        const courier = await qr.manager.findOne(User, { where: { id: courierId } });
        if (!courier) throw new NotFoundException('Courier not found');
        return courier;
    }

    async generateNextDeliveryCode(qr: QueryRunner): Promise<string> {
        const lastDelivery = await qr.manager
            .createQueryBuilder(Delivery, 'delivery')
            .orderBy('delivery.id', 'DESC')
            .limit(1)
            .getOne();

        let lastNumber = 0;
        if (lastDelivery?.code) {
            const match = lastDelivery.code.match(/DELIVERY-(\d+)/);
            if (match) lastNumber = parseInt(match[1]);
        }

        return `DELIVERY-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    private getOrderItemForWorkshop(order: Order, productId: number) {
        const item = order.items.find(i => i.product.id === productId);
        if (!item) throw new BadRequestException('Order item not found for this workshop');
        return item;
    }

    private async findCheckpointWithStockOrThrow(orderItem: OrderItem, qr: QueryRunner) {
        const checkpointWithStock = await qr.manager
            .createQueryBuilder(CheckpointStock, 'stock')
            .innerJoinAndSelect('stock.checkpoint', 'checkpoint')
            .innerJoinAndSelect('stock.product', 'product')
            .where('stock.product.id = :productId', { productId: orderItem.product.id })
            .andWhere('stock.quantity >= :minQty', { minQty: orderItem.quantity })
            .orderBy('stock.quantity', 'DESC')
            .getOne();

        if (!checkpointWithStock) {
            throw new BadRequestException('No checkpoint has enough stock for this product');
        }

        return checkpointWithStock.checkpoint.id;
    }

    private async createDeliveryItems(delivery: Delivery, orderItems: OrderItem[], address: string, qr: QueryRunner) {
        const items = orderItems.map(item => qr.manager.create(DeliveryItem ,{
            delivery,
            orderItem: item,
            product: item.product,
            quantity_delivered: item.quantity,
            address
        }));

        await qr.manager.save(DeliveryItem, items);
    }

    private async markWorkshopAsCompleted(workshop: Workshop, scheduledDate: Date, qr: QueryRunner) {
        workshop.status = WorkshopStatus.COMPLETED;
        workshop.scheduled_delivery_date = scheduledDate;
        await qr.manager.save(Workshop, workshop);
    }

}
