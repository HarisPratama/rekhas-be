import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Delete,
    NotFoundException, Patch, Query, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './shared/dto/create-invoice.dto';
import {QueryParamsDto} from "../shared/dto/query-params.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {extname} from "path";
import {CreatePaymentDto} from "./shared/dto/create-payment.dto";
import {instanceToPlain} from "class-transformer";

@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @Get()
    async findAll(@Query() query: QueryParamsDto) {
        const { page, limit, order, orderBy, search } = query;

        return this.invoiceService.findAll(page, limit, orderBy, order, search);
    }

    @Get('available')
    async getAvailableInvoices(@Query() query: {productId: string, customerId: string}) {
        return this.invoiceService.getAvailableInvoices(Number(query.productId), Number(query.customerId));
    }

    @Post('payment')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/payments',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `payment-${uniqueSuffix}${ext}`);
                },
            }),
        }),
    )
    async createPayment(
        @Body() dto: CreatePaymentDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.invoiceService.createPayment(dto, file);
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const invoice = await this.invoiceService.findOne(id);
        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }
        return instanceToPlain(invoice);
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
