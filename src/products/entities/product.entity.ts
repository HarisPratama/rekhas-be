import {Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {CheckpointStock} from "../../checkpoint-stock/checkpoint-stock.entity";
import {Expose} from "class-transformer";
import {SizePattern} from "../../size-pattern/size-pattern.entity";
import {ProductImage} from "./product-image.entity";
import {ProductTypeEnum} from "../shared/const/product-type.enum";
import {ProductSizeMeasurement} from "./product-size-measurement.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: 'https://placehold.co/40' })
    image_url: string;

    @Expose()
    get full_image_url(): string | null {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

        if (!this.image_url) {
            return null;
        }

        if (this.image_url.startsWith('http')) {
            return this.image_url;
        }

        return `${baseUrl}${this.image_url}`;
    }

    @Column({ unique: true, nullable: true })
    code: string;

    @Column()
    fabric: string;

    @Column({nullable: true})
    size: string;

    @Column({nullable: true})
    status: string;

    @Column({
        type: 'enum',
        enum: ProductTypeEnum,
        default: ProductTypeEnum.REGULAR,
    })
    type: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('decimal')
    price: number;

    @Column()
    quantity: number;

    @OneToMany(() => CheckpointStock, (cs) => cs.product)
    checkpointStocks: CheckpointStock[];

    @OneToMany(() => ProductImage, image => image.product, { cascade: true })
    images: ProductImage[];

    @OneToOne(() => ProductSizeMeasurement, (m) => m.product, { cascade: true, eager: true })
    sizeMeasurement: ProductSizeMeasurement;


    @CreateDateColumn()
    created_at: Date;
}
