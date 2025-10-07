import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll(filters: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const where: Prisma.ProductWhereInput = {};

    if (filters.category) {
      where.category = {
        contains: filters.category,
      };
    }

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
          },
        },
        {
          description: {
            contains: filters.search,
          },
        },
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Для case-insensitive фильтрации на стороне Node.js
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower),
      );
    }

    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      return products.filter((product) =>
        product.category.toLowerCase().includes(categoryLower),
      );
    }

    return products;
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Проверяем существование продукта
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    // Проверяем существование продукта
    await this.findOne(id);

    // Используем транзакцию для удаления связанных записей и продукта
    return this.prisma.$transaction(async (prisma) => {
      // 1. Удаляем связанные CartItems
      await prisma.cartItem.deleteMany({
        where: { productId: id },
      });

      // 2. Удаляем связанные OrderItems
      await prisma.orderItem.deleteMany({
        where: { productId: id },
      });

      // 3. Теперь можно удалить продукт
      return prisma.product.delete({
        where: { id },
      });
    });
  }

  async getCategories() {
    const categories = await this.prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories.map((c) => c.category);
  }
}
