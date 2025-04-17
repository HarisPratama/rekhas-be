import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {OrderItem} from "./order-item.entity";

@Entity()
export class OrderItemImage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => OrderItem, (item) => item.images)
    orderItem: OrderItem;

    @Column()
    url: string;
}
