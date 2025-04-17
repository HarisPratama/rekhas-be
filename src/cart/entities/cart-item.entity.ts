import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Cart} from "./cart.entity";
import {Product} from "../../products/entities/product.entity";
import {CustomerMeasurement} from "../../customers/entities/customer-measurement.entity";

@Entity()
export class CartItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Cart, (cart) => cart.items)
    cart: Cart;

    @ManyToOne(() => Product, { eager: true })
    product: Product;

    @Column('int')
    quantity: number;

    @ManyToOne(() => CustomerMeasurement, { eager: true })
    customerMeasurement: CustomerMeasurement;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
