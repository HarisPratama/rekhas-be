import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Delivery} from "./delivery.entity";
import {OrderItem} from "../orders/entities/order-item.entity";
import {Product} from "../products/entities/product.entity";

@Entity()
export class DeliveryItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    address: string;

    @ManyToOne(() => Delivery, delivery => delivery.items)
    delivery: Delivery;

    @ManyToOne(() => OrderItem, { nullable: true })
    orderItem: OrderItem;

    @ManyToOne(() => Product, { nullable: true })
    product: Product;

    @Column()
    quantity_delivered: number;
}
