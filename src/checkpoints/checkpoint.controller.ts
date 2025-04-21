import {Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, UploadedFile} from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { Checkpoint } from './checkpoint.entity';
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {extname} from "path";
import {instanceToPlain} from "class-transformer";

@Controller('checkpoints')
export class CheckpointController {
    constructor(private readonly checkpointService: CheckpointService) {}

    @Post()
    create(@Body() data: Partial<Checkpoint>) {
        return this.checkpointService.create(data);
    }

    @Get()
    findAll() {
        return this.checkpointService.findAll();
    }

    @Get('summary')
    async getCheckpointSummary() {
        const checkpoints = await this.checkpointService.findAllSelectedFields();
        return instanceToPlain(checkpoints);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const checkpoint = this.checkpointService.findOne(id);
        return instanceToPlain(checkpoint);
    }

    @Put(':id')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/checkpoints',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `checkpoint-${uniqueSuffix}${ext}`);
                },
            }),
        }),
    )
    update(
        @Param('id') id: number,
        @Body() data: Partial<Checkpoint>,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.checkpointService.update(id, data, file);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.checkpointService.remove(id);
    }
}
