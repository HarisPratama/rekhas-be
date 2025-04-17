// entities/product-image.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import {Product} from "./product.entity";
import {Expose} from "class-transformer";

@Entity()
export class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    uri: string;

    @Expose()
    get full_image_url(): string {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return this.uri ? `${baseUrl}/uploads/products/${this.uri}` : null;
    }

    @Column()
    angle: string;

    @Column({ nullable: true })
    remark: string;

    @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE' })
    product: Product;
}
