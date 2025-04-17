import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import {CheckpointStock} from "../checkpoint-stock/checkpoint-stock.entity";
import {CheckpointTypeEnum} from "./shared/const/checkpoint-type.enum";

@Entity('checkpoints')
export class Checkpoint {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column({ unique: true })
    code: string;

    @Column({ nullable: true })
    image_url: string;

    @Column()
    phone: string;

    @Column({
        type: 'enum',
        enum: CheckpointTypeEnum,
        default: CheckpointTypeEnum.OFFICE,
    })
    type: string;

    @Column({ nullable: true }) // allow null if a checkpoint may not have a PIC yet
    pic_id: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'pic_id' })
    pic: User;

    @OneToMany(() => CheckpointStock, (cs) => cs.checkpoint)
    checkpointStocks: CheckpointStock[];
}
