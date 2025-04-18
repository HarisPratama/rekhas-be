import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Order} from "../orders/entities/order.entity";
import {User} from "../users/user.entity";
import {WorkshopStatus} from "./shared/const/workshop-status.enum";
import {Product} from "../products/entities/product.entity";
import {CustomerMeasurement} from "../customers/entities/customer-measurement.entity";
import {OrderItem} from "../orders/entities/order-item.entity";

@Entity()
export class Workshop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    order_id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ type: 'enum', enum: WorkshopStatus, default: WorkshopStatus.ON_REQUEST })
    status: WorkshopStatus;

    @Column({ nullable: true })
    tailor_id: number;

    // workshop.entity.ts
    @ManyToOne(() => User)
    @JoinColumn({ name: 'tailor_id' })
    tailor: User;

    @Column({ nullable: true })
    cutter_id: number;

    @Column()
    order_item_id: number;

    @ManyToOne(() => OrderItem, orderItem => orderItem.workshops, { eager: true })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'cutter_id' })
    cutter: User;

    @ManyToOne(() => CustomerMeasurement, { nullable: true })
    customerMeasurement: CustomerMeasurement;

    @Column({ nullable: true })
    notes: string;

    @Column({ nullable: true })
    type: string;

    @Column({ nullable: true })
    scheduled_delivery_date: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
