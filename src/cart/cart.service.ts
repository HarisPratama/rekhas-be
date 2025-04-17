import {Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Cart} from "./entities/cart.entity";
import {Repository} from "typeorm";
import {CartItem} from "./entities/cart-item.entity";
import {Customer} from "../customers/entities/customer.entity";
import {Product} from "../products/entities/product.entity";
import {CustomerMeasurement} from "../customers/entities/customer-measurement.entity";
import {CustomerMeasurementImage} from "../customers/entities/customer-measurement-image";

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart) private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
        @InjectRepository(CustomerMeasurementImage) private custMeasurementImage: Repository<CustomerMeasurementImage>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerMeasurement) private custMeasurementRepo: Repository<CustomerMeasurement>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
    ) {
    }

    async addToCart(customerId: number, productId: number, quantity: number, customerMeasurementId: string,) {
        const customer = await this.customerRepo.findOne({ where: { id: customerId } });
        const product = await this.productRepo.findOne({ where: { id: productId } });
        const customerMeasurement = await this.custMeasurementRepo.findOneOrFail({ where: { id: customerMeasurementId } });

        let cart = await this.cartRepo.findOne({
            where: { customer: { id: customerId } },
            relations: ['items'],
        });

        if (!cart) {
            cart = this.cartRepo.create({ customer, items: [] });
        }

        const existingItem = cart.items.find((item) => item.product.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const newItem = this.cartItemRepo.create({ product, quantity, customerMeasurement });
            cart.items.push(newItem);
        }

        return this.cartRepo.save(cart);
    }

    async addToCartWithPhotos(
        customerId: number,
        dto: { productId: number; customerMeasurementId: string; quantity: number },
        photos: Express.Multer.File[]
    ) {
        const customer = await this.customerRepo.findOneByOrFail({ id: customerId });
        const product = await this.productRepo.findOneByOrFail({ id: dto.productId });
        const measurement = await this.custMeasurementRepo.findOneByOrFail({ id: dto.customerMeasurementId });

        let cart = await this.cartRepo.findOne({
            where: { customer: { id: customerId } },
            relations: ['items', 'items.product', 'items.customerMeasurement'],
        });

        if (!cart) {
            cart = this.cartRepo.create({ customer, items: [] });
            await this.cartRepo.save(cart);
        }

        let existingItem = cart.items.find(
            (item) =>
                item.product.id === dto.productId &&
                item.customerMeasurement.id === dto.customerMeasurementId
        );

        if (existingItem) {
            existingItem.quantity += dto.quantity;
            await this.cartItemRepo.save(existingItem);
        } else {
            const newItem = this.cartItemRepo.create({
                cart,
                product,
                customerMeasurement: measurement,
                quantity: dto.quantity,
            });

            existingItem = await this.cartItemRepo.save(newItem);
        }

        if (photos && photos.length > 0) {
            const imageEntities = photos.map((file) =>
                this.custMeasurementImage.create({
                    url: `/uploads/customer/product/${file.filename}`,
                    measurement,
                })
            );
            await this.custMeasurementImage.save(imageEntities);
        }

        return existingItem;
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

}