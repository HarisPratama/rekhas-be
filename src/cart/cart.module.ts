import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Cart} from "./entities/cart.entity";
import {CartItem} from "./entities/cart-item.entity";
import {CartService} from "./cart.service";
import {CartController} from "./cart.controller";
import {CustomerModule} from "../customers/customer.module";
import {ProductsModule} from "../products/product.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Cart, CartItem]),
        CustomerModule,
        ProductsModule,
    ],
    controllers: [CartController],
    providers: [CartService],
    exports: [TypeOrmModule],
})
export class CartModule {}