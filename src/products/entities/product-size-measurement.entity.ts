import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductSizeMeasurement {
    @PrimaryGeneratedColumn()
    id: number;

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

    @OneToOne(() => Product, (product) => product.sizeMeasurement, { onDelete: 'CASCADE' })
    @JoinColumn()
    product: Product;
}
