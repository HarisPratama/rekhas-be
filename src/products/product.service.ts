import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import {Checkpoint} from "../checkpoints/checkpoint.entity";
import {CheckpointStock} from "../checkpoint-stock/checkpoint-stock.entity";
import {ProductImage} from "./entities/product-image.entity";

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product) private productsRepository: Repository<Product>,
        @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
        @InjectRepository(Checkpoint) private checkpointRepo: Repository<Checkpoint>,
        @InjectRepository(CheckpointStock) private checkpointStockRepo: Repository<CheckpointStock>,
    ) {}

    async findAll(
        page = 1,
        limit = 10,
        type?: string,
        orderBy: string = 'product.created_at',
        order: 'ASC' | 'DESC' = 'DESC',
        search: string = ''
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.productsRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.checkpointStocks', 'checkpointStocks')
            .leftJoinAndSelect('checkpointStocks.checkpoint', 'checkpoint')
            .skip(skip)
            .take(limit);

        // Optional filter by type
        if (type) {
            queryBuilder.andWhere('product.type = :type', { type });
        }

        // Optional search by product name
        if (search) {
            queryBuilder.andWhere(
                `(product.name ILIKE :search OR product.code ILIKE :search OR product.fabric ILIKE :search)`,
                { search: `%${search}%` }
            );
        }

        // Ordering logic
        if (orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`product.${orderBy}`, order);
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

    async getProductForDropdown(type: string, search: string) {
        const queryBuilder = this.productsRepository
            .createQueryBuilder('product')
            .select([
                'product.id',
                'product.name',
                'product.code',
                'product.fabric',
                'product.type',
            ]);

        if (type) {
            queryBuilder.andWhere('product.type = :type', { type });
        }

        if (search) {
            queryBuilder.andWhere(
                `(product.name ILIKE :search OR product.code ILIKE :search OR product.fabric ILIKE :search)`,
                { search: `%${search}%` }
            );
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
        };
    }

    findOne(id: number) {
        return this.productsRepository.findOne(
            {
                where: { id },
                relations: ['checkpointStocks', 'checkpointStocks.checkpoint', 'images'],
            }
        );
    }

    async create(data: Partial<Product>) {
        const product = this.productsRepository.create(data);
        const savedProduct = await this.productsRepository.save(product);

        const defaultCheckpoint = await this.checkpointRepo.findOne({
            where: { code: 'CP-0000001' },
        });

        if (!defaultCheckpoint) {
            throw new Error('Default checkpoint CP-0000001 not found');
        }

        const checkpointStock = this.checkpointStockRepo.create({
            product: savedProduct,
            checkpoint: defaultCheckpoint,
            quantity: savedProduct.quantity,
        });

        await this.checkpointStockRepo.save(checkpointStock);

        return savedProduct;
    }

    async addMultipleImages(
        productId: number,
        files: Express.Multer.File[],
        angles: string[],
        remarks?: string[]
    ) {
        const product = await this.productsRepository.findOne({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');

        const images = files.map((file, i) =>
            this.imageRepo.create({
                product,
                uri: file.filename,
                angle: angles[i],
                remark: remarks?.[i] || null,
            }),
        );

        return this.imageRepo.save(images);
    }
}
