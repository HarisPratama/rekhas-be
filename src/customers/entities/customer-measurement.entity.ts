// customer-measurement.entity.ts

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn, OneToOne, OneToMany,
} from 'typeorm';
import { Customer } from './customer.entity';
import {CartItem} from "../../cart/entities/cart-item.entity";
import {CustomerMeasurementImage} from "./customer-measurement-image";

@Entity()
export class CustomerMeasurement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, (customer) => customer.measurements, { onDelete: 'CASCADE' })
    customer: Customer;

    @OneToMany(() => CartItem, (cartItem) => cartItem.customerMeasurement)
    cartItems: CartItem[];

    @Column() code: string;
    @Column({ default: 0 }) length: number;
    @Column({ default: 0 }) waist: number;
    @Column({ default: 0 }) chest: number;
    @Column({ default: 0 }) collar: number;
    @Column({ default: 0 }) shoulder: number;
    @Column({ default: 0 }) sleeveLength: number;
    @Column({ default: 0 }) upperSleeveRim: number;
    @Column({ default: 0 }) lowerSleeveRim: number;
    @Column({ default: 0 }) thigh: number;
    @Column({ default: 0 }) knee: number;
    @Column({ default: 0 }) foot: number;
    @Column({ default: 0 }) hip: number;
    @Column({ default: 0 }) armLength: number;
    @Column({ default: 0 }) cuff: number;
    @Column({ default: 0 }) kriss: number;

    @OneToMany(() => CustomerMeasurementImage, (image) => image.measurement, { cascade: true })
    images: CustomerMeasurementImage[];

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
