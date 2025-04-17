import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Order} from "./order.entity";
import {Product} from "../../products/entities/product.entity";
import {CustomerMeasurement} from "../../customers/entities/customer-measurement.entity";
import {OrderItemImage} from "./order-item-image.entity";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.items)
    order: Order;

    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => CustomerMeasurement, { nullable: true })
    customerMeasurement: CustomerMeasurement;

    @Column()
    quantity: number;

    @Column('decimal')
    price_each: number;

    @OneToMany(() => OrderItemImage, (img) => img.orderItem, { cascade: true })
    images: OrderItemImage[];
}
