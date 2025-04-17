// src/roles/role.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
    ) {}

    create(data: Partial<Role>) {
        const role = this.roleRepo.create(data);
        return this.roleRepo.save(role);
    }

    findAll() {
        return this.roleRepo.find();
    }

    findOneByName(name: string) {
        return this.roleRepo.findOne({ where: { name } });
    }
}
