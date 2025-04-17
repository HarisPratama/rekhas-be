import {BadRequestException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {DataSource, Repository} from 'typeorm';
import { CheckpointStock } from './checkpoint-stock.entity';

@Injectable()
export class CheckpointStockService {
    constructor(
        @InjectRepository(CheckpointStock)
        private readonly stockRepo: Repository<CheckpointStock>,
        private readonly dataSource: DataSource,
    ) {}

    async findAllWithRelations(
        page: number = 1,
        limit: number = 5,
        orderBy: string = 'stock.created_at',
        order: 'DESC' | 'ASC' = 'DESC',
        search: string = '',
        type?: string,
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.stockRepo
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.checkpoint', 'checkpoint')
            .skip(skip)
            .take(limit);

        if (type) {
            queryBuilder.andWhere('product.type = :type', { type });
        }

        // ordering by
        const stockColumns = ['created_at', 'updated_at', 'quantity', 'id', 'checkpointId', 'productId'];

        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');

            if (alias === 'product') {
                queryBuilder.orderBy(`product.${field}`, order || 'DESC');
            } else if (alias === 'stock') {
                queryBuilder.orderBy(`stock.${field}`, order || 'DESC');
            } else if (alias === 'checkpoint') {
                queryBuilder.orderBy(`checkpoint.${field}`, order || 'DESC');
            } else {
                // fallback untuk alias yang tidak dikenal
                queryBuilder.orderBy(orderBy, order || 'DESC');
            }
        } else if (stockColumns.includes(orderBy)) {
            queryBuilder.orderBy(`stock.${orderBy}`, order || 'DESC');
        } else {
            queryBuilder.orderBy(`stock.created_at`, order || 'DESC');
        }

        // Optional: add search condition
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

    // Optional: find by checkpoint ID
    async findByCheckpoint(
        checkpointId: number,
        page: number = 1,
        limit: number = 10,
        orderBy: string = 'created_at',
        order: 'DESC' | 'ASC' = 'DESC',
        search: string = ''
    ) {
        return this.stockRepo.find({
            where: { checkpoint: { id: checkpointId } },
            relations: ['product', 'checkpoint'],
        });
    }

    async adjustStock(checkpointId: number, productId: number, quantity: number) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let stock = await queryRunner.manager
                .getRepository(CheckpointStock)
                .createQueryBuilder('stock')
                .setLock('pessimistic_write')
                .useTransaction(true)
                .where('stock.checkpoint.id = :checkpointId AND stock.product.id = :productId', {
                    checkpointId,
                    productId,
                })
                .innerJoinAndSelect('stock.checkpoint', 'checkpoint')
                .innerJoinAndSelect('stock.product', 'product')
                .getOne();

            if (!stock) {
                stock = queryRunner.manager.create(CheckpointStock, {
                    checkpoint: { id: checkpointId },
                    product: { id: productId },
                    quantity: 0,
                });
            }

            const newQty = stock.quantity + quantity;
            if (newQty < 0) throw new BadRequestException('Not enough stock');

            stock.quantity = newQty;
            await queryRunner.manager.save(stock);
            await queryRunner.commitTransaction();
            return stock;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

}
