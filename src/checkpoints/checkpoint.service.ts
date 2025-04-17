import {Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkpoint } from './checkpoint.entity';
import {User} from "../users/user.entity";

@Injectable()
export class CheckpointService {
    constructor(
        @InjectRepository(Checkpoint) private readonly checkpointRepo: Repository<Checkpoint>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    async create(data: Partial<Checkpoint>) {
        const { pic_id } = data;

        let user: User = null;
        if (pic_id) {
            user = await this.userRepo.findOne({ where: { id: pic_id } });
            if (!user) {
                throw new NotFoundException(`PIC with ID ${pic_id} not found`);
            }
        }
        const checkpoint = this.checkpointRepo.create(data);
        return this.checkpointRepo.save(checkpoint);
    }

    findAll() {
        return this.checkpointRepo.find({
            relations: ['pic'],
        });
    }

    async findAllSelectedFields() {
        return this.checkpointRepo
            .createQueryBuilder('checkpoint')
            .select([
                'checkpoint.id',
                'checkpoint.name',
                'checkpoint.code',
                'checkpoint.type',
            ])
            .getMany();
    }

    findOne(id: number) {
        return this.checkpointRepo.findOne({ where: { id } });
    }

    update(id: number, data: Partial<Checkpoint>) {
        return this.checkpointRepo.update(id, data);
    }

    remove(id: number) {
        return this.checkpointRepo.delete(id);
    }
}
