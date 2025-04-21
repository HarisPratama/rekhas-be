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

    @ManyToOne(() => Invoice, invoice => invoice.payments, {nullable: false})
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice;

    @Column('decimal')
    amount: number;

    @Column({ type: 'enum', enum: ['partly_payment', 'full_payment'], default: 'full_payment' })
    type: 'partly_payment' | 'full_payment';

    @Column({ nullable: true })
    note: string;

    @Column()
    proof_url: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
