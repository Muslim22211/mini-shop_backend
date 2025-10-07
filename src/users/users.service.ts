import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    try {
      this.logger.log(`Creating user: ${data.email}`);

      const existingUser = await this.findByEmail(data.email);

      if (existingUser) {
        this.logger.warn(`User already exists: ${data.email}`);
        throw new ConflictException('Email already exists');
      }

      const user = await this.prisma.user.create({
        data,
      });

      // Создаем корзину для пользователя
      await this.prisma.cart.create({
        data: {
          userId: user.id,
        },
      });

      this.logger.log(`User created successfully: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`User creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
