import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Product} from "../products/entities/product.entity";

@Entity()
export class SizePattern {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    code: string;

    @Column({ nullable: true })
    chest: number;

    @Column({ nullable: true })
    shoulders: number;

    @Column({ nullable: true })
    sleeveLength: number;

    @Column({ nullable: true })
    collar: number;

    // @ManyToOne(() => Product, product => product.sizePatterns)
    // product: Product;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
