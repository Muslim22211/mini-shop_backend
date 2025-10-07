import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(@Request() req) {
    return this.ordersService.createOrder(req.user.userId);
  }

  @Get()
  getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body() body: { status: string },
  ) {
    // Приводим строку к типу OrderStatus
    const status = body.status as OrderStatus;
    return this.ordersService.updateOrderStatus(+orderId, status);
  }
}
