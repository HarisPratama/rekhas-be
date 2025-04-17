import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Checkpoint} from "../checkpoints/checkpoint.entity";
import {Product} from "../products/entities/product.entity";

@Entity('checkpoint_stock')
export class CheckpointStock {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Checkpoint)
    checkpoint: Checkpoint;

    @ManyToOne(() => Product)
    product: Product;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
