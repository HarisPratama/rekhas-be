import {
    Column,
    CreateDateColumn,
    Entity, JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { DeliveryItem } from './delivery-item.entity';
import { Checkpoint } from '../checkpoints/checkpoint.entity';
import {User} from "../users/user.entity";
import {DeliveryStatus} from "./shared/const/delivery-status.enum";

@Entity()
export class Delivery {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    order_id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' }) // link to FK
    order: Order;

    @Column({ nullable: true })
    from_id: number;

    @ManyToOne(() => Checkpoint)
    @JoinColumn({ name: 'from_id' }) // link to FK
    from: Checkpoint;

    @Column()
    to_type: 'customer' | 'checkpoint'; // 👈 set this as ENUM if you want

    @Column()
    to_id: number; // 👈 will store the ID of either customer or checkpoint

    @Column({ nullable: true })
    delivered_at: Date;

    @Column({ nullable: true })
    scheduled_at: Date;

    @Column({ nullable: true })
    suggested_at: Date;

    @Column({
        type: 'enum',
        enum: DeliveryStatus,
        default: DeliveryStatus.IN_TRANSIT,
    })
    status: DeliveryStatus;

    @Column({ unique: true, nullable: true })
    code: string;

    @Column({ default: false })
    is_priority: boolean;

    @Column({ nullable: true })
    note: string;

    @Column({ nullable: true })
    proof_image_url: string;

    @Column({ default: 'order_delivery' }) // or 'internal_transfer', etc.
    type: 'order_delivery' | 'internal_transfer';

    @OneToMany(() => DeliveryItem, (item) => item.delivery, { cascade: true })
    items: DeliveryItem[];

    @Column()
    courier_id: number;

    // 👇 Relationship to Courier
    @ManyToOne(() => User)
    @JoinColumn({ name: 'courier_id' }) // link to FK
    courier: User;

    @CreateDateColumn()
    created_at: Date;
}
