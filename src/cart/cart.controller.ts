import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('add')
  addToCart(
    @Request() req,
    @Body() body: { productId: number; quantity?: number },
  ) {
    return this.cartService.addToCart(
      req.user.userId,
      body.productId,
      body.quantity,
    );
  }

  @Put('item/:id')
  updateCartItem(
    @Request() req,
    @Param('id') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateCartItem(
      req.user.userId,
      +itemId,
      body.quantity,
    );
  }

  @Delete('item/:id')
  removeFromCart(@Request() req, @Param('id') itemId: string) {
    return this.cartService.removeFromCart(req.user.userId, +itemId);
  }

  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}
