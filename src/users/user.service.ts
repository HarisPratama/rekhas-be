import {BadRequestException, Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import {CreateUserDto} from "./shared/dto/create-user.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {}

    async generateUserCode() {
        const lastCustomer = await this.userRepo.findOne({
            where: {},
            order: { id: 'DESC' },
        });

        let lastNumber = 0;

        if (lastCustomer && lastCustomer.code) {
            const match = lastCustomer.code.match(/U-(\d+)/);

            if (match) {
                lastNumber = parseInt(match[1], 10);
            }
        }

        return `U-${String(lastNumber + 1).padStart(5, '0')}`;
    }

    async create(data: CreateUserDto, file?: Express.Multer.File) {
        if (data.whatsapp_number) {
            if (data.whatsapp_number[0] !== '6' || data.whatsapp_number[1] !== '2') {
                if (data.whatsapp_number[0] === '0') {
                    data.whatsapp_number = data.whatsapp_number.slice(1);
                }
                data.whatsapp_number = '+62' + data.whatsapp_number;
            }

            const existing = await this.userRepo.findOne({ where: { whatsapp_number: data.whatsapp_number } });
            if (existing) {
                throw new BadRequestException('WhatsApp number already exists');
            }
        }

        const newCode = await this.generateUserCode();

        const user = this.userRepo.create({
            ...data,
            code: newCode,
            image_url: file?.filename,
        });

        return this.userRepo.save(user);
    }


    async findAll(
        role?: string,
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
            .leftJoinAndSelect('user.checkpoint', 'checkpoint')
            .skip(skip)
            .take(limit);

        if (role) {
            queryBuilder.andWhere('role.name = :roleName', { roleName: role })
        }

        if (orderBy && orderBy.includes('.')) {
            const [alias, field] = orderBy.split('.');
            queryBuilder.orderBy(`${alias}.${field}`, order);
        } else {
            queryBuilder.orderBy(`user.${orderBy}`, order);
        }

        if (search.length > 0) {
            queryBuilder.andWhere(
                `(user.name ILIKE :search OR user.code ILIKE :search OR user.nickname ILIKE :search)`,
                { search: `%${search}%` }
            );
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
