import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Invoice} from "./invoice.entity";

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Invoice, invoice => invoice.payments)
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice;

    @Column('decimal', { precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: ['PARTIAL', 'FULL'], default: 'PARTIAL' })
    type: 'PARTIAL' | 'FULL';

    @Column({ nullable: true })
    note: string;

    @Column()
    proof_url: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
