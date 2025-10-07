import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async addToCart(userId: number, productId: number, quantity: number = 1) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          items: {
            create: [],
          },
        },
        include: { items: true },
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
        include: { product: true },
      });
    }
  }

  async updateCartItem(userId: number, itemId: number, quantity: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((item) => item.id === itemId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    if (quantity <= 0) {
      return this.removeFromCart(userId, itemId);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeFromCart(userId: number, itemId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((item) => item.id === itemId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }
}
