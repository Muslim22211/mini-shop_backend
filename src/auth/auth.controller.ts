import {
  Controller,
  Post,
  Body,
  Logger,
  InternalServerErrorException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return {
      user: req.user,
      message: 'Current user information',
    };
  }
  // Временный endpoint для создания администратора
  @Post('create-admin')
  async createAdmin() {
    try {
      this.logger.log('Attempting to create admin user...');

      const hashedPassword = await bcrypt.hash('admin123', 10);
      this.logger.log('Password hashed successfully');

      // Проверяем подключение к базе
      await this.prisma.$connect();
      this.logger.log('Database connection established');

      const admin = await this.prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
          // Если пользователь уже существует, обновляем его до администратора
          role: 'ADMIN',
          password: hashedPassword,
        },
        create: {
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          cart: {
            create: {},
          },
        },
      });

      this.logger.log(`Admin user ${admin.email} created/updated successfully`);

      // Проверим, что пользователь действительно сохранен
      const verifiedAdmin = await this.prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      this.logger.log('Verified admin in database:', verifiedAdmin);

      return {
        message: 'Admin user created successfully',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
        loginCredentials: {
          email: 'admin@example.com',
          password: 'admin123',
        },
        databaseVerified: !!verifiedAdmin,
      };
    } catch (error) {
      this.logger.error('Failed to create admin user', error.stack);
      throw new InternalServerErrorException({
        message: 'Failed to create admin user',
        error: error.message,
        details: error.stack,
      });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    // На сервере мы просто возвращаем успешный ответ
    // Клиент должен удалить токен со своей стороны
    return {
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };
  }
}
