import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
    CreateDateColumn, ManyToMany, JoinTable, OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Customer } from '../../customers/entities/customer.entity';
import {Product} from "../../products/entities/product.entity";
import {Payment} from "./payment.entity";
import {InvoiceStatusEnum} from "../shared/const/invoice-status.enum";

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    code: string;

    @Column()
    notes: string;

    @Column({ type: 'decimal', default: 0 })
    total_amount: number;

    @Column({nullable: true})
    due_date: Date;

    @Column({
        type: 'enum',
        enum: InvoiceStatusEnum,
        default: InvoiceStatusEnum.UNPAID,
    })
    status: string; // e.g. "PAID", "UNPAID", "CANCELLED"

    @CreateDateColumn()
    created_at: Date;

    @Column({ nullable: true })
    order_id: number;

    @OneToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ nullable: true }) // ⬅️ tambahkan ini
    customer_id: number;

    @ManyToOne(() => Customer, { nullable: true }) // ⬅️ tambahkan ini juga
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @ManyToMany(() => Product)
    @JoinTable({
        name: 'invoice_products', // custom join table name
        joinColumn: {
            name: 'invoice_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'product_id',
            referencedColumnName: 'id',
        },
    })
    products: Product[];

    @OneToMany(() => Payment, payment => payment.invoice)
    payments: Payment[];
}
