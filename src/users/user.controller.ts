// src/users/user.controller.ts
import {Controller, Get, Post, Body, Param, Delete, Put, Query, UseInterceptors, UploadedFile} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import {CreateUserDto, VerifyOtpDto} from "./shared/dto/create-user.dto";
import {QueryUserDto} from "./shared/dto/query-param-user.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {extname} from "path";
import {QueryParamsDto} from "../shared/dto/query-params.dto";
import {instanceToPlain} from "class-transformer";

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() data: CreateUserDto) {
        return this.userService.create(data);
    }

    @Post('send-otp')
    async sendOtp(@Body('phoneNumber') phoneNumber: string) {
        return this.userService.sendOtp(phoneNumber);
    }

    @Post('verify-otp')
    async verifyOtp(
        @Body() data: VerifyOtpDto,
    ) {
        const { hash, otp } = data
        return this.userService.verifyOtp(hash, otp);
    }

    @Post('profile')
    @UseInterceptors(
        FileInterceptor('profile', {
            storage: diskStorage({
                destination: './uploads/profiles',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async createUser(
        @Body() body: CreateUserDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.userService.create(body, file);
    }

    @Get()
    async findAll(@Query() query: QueryParamsDto) {
        const {
            page = 1,
            limit = 10,
            order = 'DESC',
            orderBy = 'user.created_at',
            search = '',
            role
        } = query;
        const users = await this.userService.findAll(role, page, limit, orderBy, order, search);
        return instanceToPlain(users)
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
