import {CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Customer} from "../../customers/entities/customer.entity";
import {CartItem} from "./cart-item.entity";

@Entity()
export class Cart {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, (customer) => customer.carts)
    customer: Customer;

    @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: true })
    items: CartItem[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
