// src/users/user.controller.ts
import {Controller, Get, Post, Body, Param, Delete, Put, Query} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import {CreateUserDto} from "./shared/dto/create-user.dto";
import {QueryUserDto} from "./shared/dto/query-param-user.dto";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() data: CreateUserDto) {
        return this.userService.create(data);
    }

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    @Get('couriers')
    findAllDrivers() {
        return this.userService.findAllDrivers();
    }

    @Get('by-role')
    findAllByRole(
        @Query() query: QueryUserDto,
    ) {
        const { role, page, limit, orderBy, order, search } = query;
        return this.userService.findByRole(role, page, limit, orderBy, order, search);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.userService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: Partial<User>) {
        return this.userService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.userService.remove(id);
    }
}
