import {Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, UploadedFiles, Query} from '@nestjs/common';
import {FileInterceptor, FilesInterceptor} from "@nestjs/platform-express";
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ProductsService } from './product.service';
import {instanceToPlain} from "class-transformer";
import {QueryProductDto} from "./shared/dto/query-product.dto";

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/products',
                filename: (req, file, callback) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                },
            }),
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
        const imageUrl = `/uploads/products/${file.filename}`;
        return this.productsService.create({ ...body, image_url: imageUrl });
    }

    @Post(':id/images')
    @UseInterceptors(FilesInterceptor('files', 9, {
        storage: diskStorage({
            destination: './uploads/products',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    }))
    async uploadMultipleImages(
        @Param('id') id: number,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: {
            angles: string[]; // contoh: ['FRONT', 'BACK']
            remarks?: string[]; // optional
        }
    ) {
        return this.productsService.addMultipleImages(+id, files, body.angles, body.remarks);
    }

    @Get()
    async findAll(@Query() query: QueryProductDto) {
        const {
            page = 1,
            limit = 10,
            type,
            order = 'DESC',
            orderBy = 'product.created_at',
            search = '',
        } = query;
        const products = await this.productsService.findAll(
            page,
            limit,
            type,
            orderBy,
            order,
            search
        );

        return instanceToPlain(products);
    }

    @Get('dropdown')
    findMany(@Query() query: {type: string, search: string}) {
        return this.productsService.getProductForDropdown(query.type, query.search);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        const product = this.productsService.findOne(+id);
        return instanceToPlain(product);
    }

    @Post()
    create(@Body() body: any) {
        return this.productsService.create(body);
    }
}
