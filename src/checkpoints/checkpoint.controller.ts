import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { Checkpoint } from './checkpoint.entity';

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
        return this.checkpointService.findAllSelectedFields();
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.checkpointService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: Partial<Checkpoint>) {
        return this.checkpointService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.checkpointService.remove(id);
    }
}
