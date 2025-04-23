import {BadRequestException, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import {CreateUserDto} from "./shared/dto/create-user.dto";
import {generateOtp, normalizeInternationalPhoneNumber} from "../common/helpers/otp-generator.helper";
import {sendWhatsAppMessage} from "../common/helpers/wa-chat.helper";
import {JwtService} from "@nestjs/jwt";
import {createHmac} from "crypto";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    getSecretKey() {
        return this.configService.get<string>('SECRET_KEY');
    }

    async sendOtp(phoneNumber: string) {
        try {
            const normalizedPhone = normalizeInternationalPhoneNumber(phoneNumber);

            const { otp, hash, expires } = generateOtp(normalizedPhone);

            const message = `Hai Sobat Rekhas \n${otp} adalah kode OTP anda untuk login.\nKode ini bersifat rahasia, jangan berikan kode ke siapapun.\n \n Salam,\n Rekhas Auto Message`;
            await sendWhatsAppMessage(phoneNumber, message);

            // Return hash ke client buat nanti verify
            return {
                hash: `${hash}.${phoneNumber}.${expires}`,
                expires,
            };
        } catch (error) {
            throw new UnauthorizedException();
        }
    }

    async verifyOtp(hash: string, otp: string) {
        const [hashed, phoneNumber, expires] = hash.split('.');

        const now = Date.now();
        if (now > parseInt(expires)) {
            throw new BadRequestException('Code expired');
        }

        const data = `${otp}.${phoneNumber}.${expires}`;
        const newHash = createHmac('SHA256', this.getSecretKey())
            .update(data)
            .digest('hex');

        if (hashed !== newHash) {
            throw new UnauthorizedException('Wrong code input');
        }

        const user = await this.userRepo.findOne(
            { where: { whatsapp_number: '+' + phoneNumber },
            relations: ['role']}
        );
        if (!user) throw new UnauthorizedException('User not found');

        const accessToken = this.jwtService.sign({ sub: user.id });

        return {
            accessToken,
            user,
        };
    }

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
            let phone = data.whatsapp_number.trim();

            if (phone.startsWith('+62')) {

            } else if (phone.startsWith('62')) {
                phone = '+' + phone;
            } else if (phone.startsWith('0')) {
                phone = '+62' + phone.slice(1);
            } else {
                throw new BadRequestException('Invalid WhatsApp number format');
            }

            data.whatsapp_number = phone;

            const existing = await this.userRepo.findOne({ where: { whatsapp_number: phone } });
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
