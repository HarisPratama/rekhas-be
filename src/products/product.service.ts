import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';

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

    async importFromExcel(filePath: string) {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        const productsToSave: Product[] = [];
        const errors = [];

        for (const [index, row] of data.entries()) {
            const rowNumber = index + 2; // +2 karena row pertama header, index mulai dari 0

            const requiredFields = ['Name', 'Product Code', 'Fabric Code', 'Type', 'Price', 'Qty'];
            const missingFields = requiredFields.filter((f) => !row[f] && row[f] !== 0);

            if (missingFields.length > 0) {
                errors.push(`Row ${rowNumber}: Missing fields - ${missingFields.join(', ')}`);
                continue;
            }

            const existing = await this.productsRepository.findOne({ where: { code: row['Product Code'] } });
            if (existing) {
                errors.push(`Row ${rowNumber}: Product with code '${row['Product Code']}' already exists`);
                continue;
            }

            const product = this.productsRepository.create({
                name: row['Name'],
                code: row['Product Code'],
                fabric: row['Fabric Code'],
                size: row['Size'] || null,
                status: row['Status'] || null,
                type: row['Type'],
                description: row['Description'] || '',
                price: Number(row['Price']),
                quantity: Number(row['Qty']),
                sizeMeasurement: {
                    length: Number(row['Length'] ?? 0),
                    waist: Number(row['Waist'] ?? 0),
                    chest: Number(row['Chest'] ?? 0),
                    collar: Number(row['Collar'] ?? 0),
                    shoulder: Number(row['Shoulder'] ?? 0),
                    sleeveLength: Number(row['Sleeve Length'] ?? 0),
                    upperSleeveRim: Number(row['Upper Sleeve Rim'] ?? 0),
                    lowerSleeveRim: Number(row['Lower Sleeve Rim'] ?? 0),
                    thigh: Number(row['Thigh'] ?? 0),
                    knee: Number(row['Knee'] ?? 0),
                    foot: Number(row['Foot'] ?? 0),
                    hip: Number(row['Hip'] ?? 0),
                    armLength: Number(row['Arm Length'] ?? 0),
                    cuff: Number(row['Cuff'] ?? 0),
                    kriss: Number(row['Kriss'] ?? 0),
                }
            });

            productsToSave.push(product);
        }

        const savedProducts = await this.productsRepository.save(productsToSave);

        return {
            message: `${savedProducts.length} product(s) imported successfully`,
            errors,
        };
    }

}
