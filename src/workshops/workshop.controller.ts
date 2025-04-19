import {Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query} from "@nestjs/common";
import {WorkshopService} from "./workshop.service";
import {QueryParamsDto} from "../shared/dto/query-params.dto";
import {instanceToPlain} from "class-transformer";
import {WorkshopStatus} from "./shared/const/workshop-status.enum";


@Controller('workshops')
export class WorkshopsController {
    constructor(private readonly workshopService: WorkshopService) {}

    @Get()
    async findAll(@Query() query: QueryParamsDto) {
        const {
            page = 1,
            limit = 10,
            order = 'DESC',
            orderBy = 'product.created_at',
            search = '',
        } = query;

        const workShops = await this.workshopService.findAll(page, limit, orderBy, order, search);
        return instanceToPlain(workShops);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const workShop = await this.workshopService.findOne(Number(id))
        return instanceToPlain(workShop);
    }
    @Get('product/:id')
    async findOneWithProduct(@Param('id') id: string) {
        const workShop = await this.workshopService.getWorkshopProducts(Number(id))
        return instanceToPlain(workShop);
    }

    @Post(':id/schedule-delivery')
    scheduleDelivery(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: { courierId: number, scheduledDate: Date, note: string, address: string, isPriority: boolean },
    ) {
        const { courierId, scheduledDate, note, address, isPriority } = payload;
        return this.workshopService.scheduleDelivery(id, courierId, scheduledDate, note, address, isPriority);
    }

    @Patch(':id/assign')
    async assignWorkers(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: { tailorId?: number; cutterId?: number }
    ) {
        return this.workshopService.assignWorkers(id, payload);
    }

    @Patch(':id/update-status')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: { status: WorkshopStatus }
    ) {
        return this.workshopService.updateStatus(id, payload.status)
    }

}
