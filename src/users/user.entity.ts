import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Checkpoint } from '../checkpoints/checkpoint.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({unique: true})
    code: string;

    @Column({ nullable: true })
    nick_name: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ default: false })
    is_pic: boolean;

    @Column({ nullable: true })
    payments: string;

    @Column({ nullable: true, unique: true })
    whatsapp_number: string;

    // ✅ Foreign key for role
    @Column()
    roleId: number;

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn({ name: 'roleId' })
    role: Role;

    // ✅ Foreign key for checkpoint (store)
    @Column({ nullable: true })
    checkpoint_id: number;

    @ManyToOne(() => Checkpoint)
    @JoinColumn({ name: 'checkpoint_id' })
    checkpoint: Checkpoint;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
