import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Checkpoint } from '../checkpoints/checkpoint.entity';
import {Expose} from "class-transformer";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({unique: true})
    code: string;

    @Column({ nullable: true })
    nickname: string;

    @Column({ nullable: true })
    image_url: string;

    @Expose()
    get full_image_url(): string {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return this.image_url ? `${baseUrl}/uploads/profiles/${this.image_url}` : null;
    }

    @Column({ default: false })
    is_pic: boolean;

    @Column({ nullable: true })
    payments: string;

    @Column({ nullable: true, unique: true })
    whatsapp_number: string;

    // ✅ Foreign key for role
    @Column()
    role_id: number;

    @ManyToOne(() => Role, role => role.users)
    @JoinColumn({ name: 'role_id' })
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
