import { Controller, Post, Get, Body } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';

@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    create(@Body() data: Partial<Role>) {
        return this.roleService.create(data);
    }

    @Get()
    findAll() {
        return this.roleService.findAll();
    }
}
