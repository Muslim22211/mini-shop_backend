import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      this.logger.log(`Attempting to register user: ${registerDto.email}`);

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.usersService.create({
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name, // Добавляем имя если есть
      });

      this.logger.log(`User registered successfully: ${user.email}`);

      const payload = { email: user.email, sub: user.id, role: user.role };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`Attempting login for: ${loginDto.email}`);

      const user = await this.usersService.findByEmail(loginDto.email);

      if (!user) {
        this.logger.warn(`Login failed: User not found - ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Login failed: Invalid password for - ${loginDto.email}`,
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`Login successful: ${user.email}`);

      const payload = { email: user.email, sub: user.id, role: user.role };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
