import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Checkpoint} from "../../checkpoints/checkpoint.entity";
import {CheckpointStock} from "../../checkpoint-stock/checkpoint-stock.entity";
import {Expose} from "class-transformer";
import {SizePattern} from "../../size-pattern/size-pattern.entity";
import {ProductImage} from "./product-image.entity";
import {ProductTypeEnum} from "../shared/const/product-type.enum";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    image_url: string;

    @Expose()
    get full_image_url(): string {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return this.image_url ? `${baseUrl}${this.image_url}` : null;
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

    @CreateDateColumn()
    created_at: Date;
}
