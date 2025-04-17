import {BadRequestException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async create(data: Partial<User>) {
        if (data.whatsapp_number) {
            const existing = await this.userRepo.findOne({ where: { whatsapp_number: data.whatsapp_number } });
            if (existing) {
                throw new BadRequestException('WhatsApp number already exists');
            }
        }

        const user = this.userRepo.create(data);
        return this.userRepo.save(user);
    }

    findAll() {
        return this.userRepo.find({
            relations: ['role'],
        });
    }

    async findAllDrivers() {
        return this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .where('role.name = :roleName', { roleName: 'COURIER' })
            .select([
                'user.id',
                'user.name',
                'role.id',
                'role.name',
            ])
            .getMany();
    }
    async findByRole(
        role: string,
        page: number = 1,
        limit: number = 10,
        orderBy: string = 'id',
        order: 'DESC' | 'ASC' = 'DESC',
        search: string = ''
    ) {
        const skip = (page - 1) * limit;

        const queryBuilder = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .where('role.name = :roleName', { roleName: role })
            .select([
                'user.id',
                'user.name',
                'role.id',
                'role.name',
            ])
            .skip(skip)
            .take(limit);

        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`user.${orderBy}`, order);
        }

        if (search.length > 0) {
            queryBuilder.andWhere('user.name ILIKE :search', { search: `%${search}%` });
        }

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    findOne(id: number) {
        return this.userRepo.findOne({ where: { id } });
    }

    update(id: number, data: Partial<User>) {
        return this.userRepo.update(id, data);
    }

    remove(id: number) {
        return this.userRepo.delete(id);
    }
}
