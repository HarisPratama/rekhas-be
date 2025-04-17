import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Delete,
    NotFoundException, Patch, Query,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './shared/dto/create-invoice.dto';
import {QueryProductDto} from "../products/shared/dto/query-product.dto";

@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @Get()
    async findAll(@Query() query: QueryProductDto) {
        const { page, limit, order, orderBy, search } = query;

        return this.invoiceService.findAll(page, limit, orderBy, order, search);
    }

    @Get('available')
    async getAvailableInvoices(@Query() query: {productId: number, customerId: number}) {
        return this.invoiceService.getAvailableInvoices(query.productId, query.customerId);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const invoice = await this.invoiceService.findOne(id);
        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }
        return invoice;
    }

    @Patch(':id/order/:orderId')
    async updateOrder(
        @Param('id') invoiceId: number,
        @Param('orderId') orderId: number,
    ) {
        return this.invoiceService.updateOrderId(invoiceId, orderId);
    }


    @Post()
    async create(@Body() dto: CreateInvoiceDto) {
        return this.invoiceService.createInvoice(dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: number) {
        return this.invoiceService.remove(id);
    }
}
