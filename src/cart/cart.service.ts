import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Cart} from "./entities/cart.entity";
import {DataSource, Repository} from "typeorm";
import {CartItem} from "./entities/cart-item.entity";
import {Customer} from "../customers/entities/customer.entity";
import {Product} from "../products/entities/product.entity";
import {CustomerMeasurement} from "../customers/entities/customer-measurement.entity";
import {CustomerMeasurementImage} from "../customers/entities/customer-measurement-image";
import {CollectionCategory} from "../orders/shared/const/collection-category.enum";

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart) private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
        @InjectRepository(CustomerMeasurementImage) private custMeasurementImage: Repository<CustomerMeasurementImage>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerMeasurement) private custMeasurementRepo: Repository<CustomerMeasurement>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        private readonly dataSource: DataSource
    ) {
    }

    async addToCart(
        customerId: number,
        productId: number,
        quantity: number,
        customerMeasurementId: string,
        collection_category?: CollectionCategory,
    ) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const customer = await queryRunner.manager.findOneOrFail(this.customerRepo.target, {
                where: { id: customerId },
            });

            const product = await queryRunner.manager.findOneOrFail(this.productRepo.target, {
                where: { id: productId },
            });

            const customerMeasurement = await queryRunner.manager.findOneOrFail(this.custMeasurementRepo.target, {
                where: { id: customerMeasurementId },
            });

            let cart = await queryRunner.manager.findOne(this.cartRepo.target, {
                where: { customer: { id: customerId } },
                relations: ['items', 'items.product', 'items.customerMeasurement'],
            });

            if (!cart) {
                cart = this.cartRepo.create({ customer, items: [] });
                cart = await queryRunner.manager.save(this.cartRepo.target, cart);
            }

            let existingItem = cart.items.find(
                (item) =>
                    item.product.id === productId &&
                    item.customerMeasurement.id === customerMeasurementId,
            );

            if (collection_category && existingItem) {
                if (existingItem.collection_category !== collection_category) {
                    existingItem = null;
                }
            }

            if (existingItem) {
                existingItem.quantity += quantity;
                await queryRunner.manager.save(this.cartItemRepo.target, existingItem);
            } else {
                const newItem = this.cartItemRepo.create({
                    product,
                    quantity,
                    customerMeasurement,
                    cart,
                    collection_category,
                });

                await queryRunner.manager.save(this.cartItemRepo.target, newItem);
            }

            await queryRunner.commitTransaction();
            return cart;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async addToCartWithPhotos(
        customerId: number,
        dto: {
            productId: number;
            customerMeasurementId: string;
            quantity: number;
            collection_category?: CollectionCategory;
        },
        photos: Express.Multer.File[],
    ) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const customer = await queryRunner.manager.findOneByOrFail(this.customerRepo.target, { id: customerId });
            const product = await queryRunner.manager.findOneByOrFail(this.productRepo.target, { id: dto.productId });
            const measurement = await queryRunner.manager.findOneByOrFail(this.custMeasurementRepo.target, {
                id: dto.customerMeasurementId,
            });

            let cart = await queryRunner.manager.findOne(this.cartRepo.target, {
                where: { customer: { id: customerId } },
                relations: ['items', 'items.product', 'items.customerMeasurement'],
            });

            if (!cart) {
                cart = this.cartRepo.create({ customer, items: [] });
                cart = await queryRunner.manager.save(this.cartRepo.target, cart);
            }

            let existingItem = cart.items.find(
                (item) =>
                    item.product.id === dto.productId &&
                    item.customerMeasurement.id === dto.customerMeasurementId,
            );

            if (dto.collection_category && existingItem) {
                if (existingItem.collection_category !== dto.collection_category) {
                    existingItem = null;
                }
            }

            if (existingItem) {
                existingItem.quantity += dto.quantity;
                await queryRunner.manager.save(this.cartItemRepo.target, existingItem);
            } else {
                const newItem = this.cartItemRepo.create({
                    cart,
                    product,
                    customerMeasurement: measurement,
                    quantity: dto.quantity,
                    collection_category: dto.collection_category,
                });

                existingItem = await queryRunner.manager.save(this.cartItemRepo.target, newItem);
            }

            if (photos && photos.length > 0) {
                const imageEntities = photos.map((file) =>
                    this.custMeasurementImage.create({
                        url: `/uploads/customer/product/${file.filename}`,
                        measurement,
                    }),
                );
                await queryRunner.manager.save(this.custMeasurementImage.target, imageEntities);
            }

            await queryRunner.commitTransaction();
            return existingItem;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    async getCarts() {
        return this.cartRepo.find({
            relations: ['items', 'items.product', 'items.customerMeasurement', 'items.customerMeasurement.images', 'customer'],
        });
    }

    async getCartDetail(cartId: number) {
        return this.cartRepo.findOne({
            where: { id: cartId } ,
            relations: ['items', 'items.product', 'items.customerMeasurement', 'items.customerMeasurement.images', 'customer'],
        });
    }
    async getCart(customerId: number) {
        return this.cartRepo.findOne({
            where: { customer: { id: customerId } },
            relations: ['items', 'items.product'],
        });
    }

    async deleteCartItem(cartItemId: number): Promise<void> {
        const cartItem = await this.cartItemRepo.findOne({
            where: { id: cartItemId },
            relations: ['cart'],
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        await this.cartItemRepo.remove(cartItem);
    }


}