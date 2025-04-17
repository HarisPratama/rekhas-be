import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from 'typeorm';
import {CustomerMeasurement} from "./customer-measurement.entity";
import {Cart} from "../../cart/entities/cart.entity";
import {Order} from "../../orders/entities/order.entity";

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ unique: true })
    code: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'int', default: 0 })
    num_of_orders: number;

    @Column({ type: 'int', default: 0 })
    num_of_items: number;

    @Column({ type: 'int', default: 0 })
    outstanding: number;

    @Column({ unique: true })
    phone: string;

    @Column({ type: 'int', default: 0 })
    revenue: number;

    @OneToMany(() => CustomerMeasurement, (m) => m.customer)
    measurements: CustomerMeasurement[];

    @OneToMany(() => Order, (order) => order.customer)
    orders: Order[]

    @OneToMany(() => Cart, (cart) => cart.customer)
    carts: Cart[];
}
