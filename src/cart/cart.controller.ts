import {Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UploadedFiles, UseInterceptors} from "@nestjs/common";
import {CartService} from "./cart.service";
import {FilesInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import {extname} from "path";
import {instanceToPlain} from "class-transformer";

@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get('')
    async getCarts() {
        const carts = await this.cartService.getCarts();
        return instanceToPlain(carts);
    }
    @Get('/:id')
    async getCartDetail(@Param('id') id: string) {
        const cart = await this.cartService.getCartDetail(Number(id));
        return instanceToPlain(cart);
    }

    @Post(':customerId/cart')
    addToCart(
        @Param('customerId') customerId: number,
        @Body() { productId, quantity, customerMeasurementId }: { productId: number; quantity: number, customerMeasurementId: string }
    ) {
        return this.cartService.addToCart(customerId, productId, quantity, customerMeasurementId);
    }

    @Post(':customerId/cart-photos')
    @UseInterceptors(FilesInterceptor('photos', 6, {
        storage: diskStorage({
            destination: './uploads/customer/product',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    })) // upload multiple
    async addToCarPhotos(
        @Param('customerId', ParseIntPipe) customerId: number,
        @Body() body: { productId: number; customerMeasurementId: string; quantity: number },
        @UploadedFiles() photos: Express.Multer.File[]
    ) {
        const cartItem = await this.cartService.addToCartWithPhotos(customerId, body, photos);
        return instanceToPlain(cartItem);
    }


    @Get(':customerId/cart')
    getCart(@Param('customerId') customerId: number) {
        return this.cartService.getCart(customerId);
    }

    @Delete('items/:id')
    async deleteCartItem(@Param('id', ParseIntPipe) id: number) {
        await this.cartService.deleteCartItem(id);
        return { message: 'Cart item deleted successfully' };
    }

}
