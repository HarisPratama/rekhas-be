import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn, OneToOne, UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Customer } from '../../customers/entities/customer.entity';
import {User} from "../../users/user.entity";
import {OrderStatus} from "../shared/const/order-status.enum";
import {OrderPriorityEnum} from "../shared/const/order-priority.enum";
import {OrderPaymentMethod, OrderPaymentType} from "../shared/const/order-payment-type.enum";
import {Invoice} from "../../invoices/entities/invoice.entity";

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    account_number: string;

    @Column()
    bank_name: string;

    @Column()
    code: string;

    @Column({
        type: 'enum',
        enum: OrderPaymentMethod,
        default: OrderPaymentMethod.CASH,
    })
    payment_method: OrderPaymentMethod;

    @Column({
        type: 'enum',
        enum: OrderPaymentType,
        default: OrderPaymentType.FULL_PAYMENT,
    })
    payment_type: OrderPaymentType;

    @Column()
    due_date: Date;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column('decimal', { nullable: true })
    total_amount: number;

    @Column({
        type: 'enum',
        enum: OrderPriorityEnum,
        default: OrderPriorityEnum.NORMAL,
    })
    priority: OrderPriorityEnum;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true }) // <--- tambahkan cascade
    items: OrderItem[];

    @UpdateDateColumn()
    updated_at: Date;

    @CreateDateColumn()
    created_at: Date;

    // 👇 Foreign key column
    @Column()
    customer_id: number;

    // 👇 Relationship to Customer
    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customer_id' }) // link to FK
    customer: Customer;

    @Column()
    sales_id: number;

    // 👇 Relationship to Sales
    @ManyToOne(() => User)
    @JoinColumn({ name: 'sales_id' }) // link to FK
    sales: Customer;

    @OneToOne(() => Invoice, (invoice) => invoice.order, { nullable: true })
    invoice?: Invoice;
}
