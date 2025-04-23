import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Order} from "./order.entity";
import {Product} from "../../products/entities/product.entity";
import {CustomerMeasurement} from "../../customers/entities/customer-measurement.entity";
import {OrderItemImage} from "./order-item-image.entity";
import {Workshop} from "../../workshops/workshop.entity";
import {CollectionCategory} from "../shared/const/collection-category.enum";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, order => order.items)
    order: Order;

    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => CustomerMeasurement, { nullable: true })
    customerMeasurement: CustomerMeasurement;

    @Column()
    quantity: number;

    @Column('decimal')
    price_each: number;

    @Column({
        type: 'enum',
        enum: CollectionCategory,
        nullable: true
    })
    collection_category: 'shirt' | 'trouser' | 'suit';

    @OneToMany(() => OrderItemImage, (img) => img.orderItem, { cascade: true })
    images: OrderItemImage[];

    // order-item.entity.ts
    @OneToMany(() => Workshop, workshop => workshop.orderItem)
    workshops: Workshop[];
}
