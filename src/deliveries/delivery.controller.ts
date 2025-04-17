import {Controller, Post, Body, Get, Query, UseInterceptors, Param, UploadedFile, ParseIntPipe} from '@nestjs/common';
import { DeliveriesService } from './delivery.service';
import {QueryDeliveryDto} from "./shared/dto/query-delivery.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {extname} from "path";
import {CreateInternalTransferDto} from "./shared/dto/create-internal-transfer.dto";
import {instanceToPlain} from "class-transformer";

@Controller('deliveries')
export class DeliveriesController {
    constructor(private readonly deliveriesService: DeliveriesService) {}

    @Post('customer')
    create(@Body() body: any) {
        return this.deliveriesService.createCustomerDelivery(body.delivery, body.items);
    }

    @Post('internal-transfer')
    createInternalTransfer(@Body() dto: CreateInternalTransferDto) {
        return this.deliveriesService.createInternalTransfer(dto);
    }

    @Get()
    findAll(@Query() query: QueryDeliveryDto) {
        const { page, limit, type, order, orderBy, search } = query;

        if (type.length > 0) {
            return this.deliveriesService.findAllByType(Number(page),Number(limit), orderBy, order, type, search)
        }
        return this.deliveriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const delivery = await this.deliveriesService.findOneById(id);
        return instanceToPlain(delivery);
    }

    @Post(':id/proof')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/proofs',
            filename: (req, file, cb) => {
                const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueName}${extname(file.originalname)}`);
            }
        }),
    }))
    async uploadProof(
        @Param('id') id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.deliveriesService.uploadProofAndAdjustStock(id, file.filename);
    }
}
