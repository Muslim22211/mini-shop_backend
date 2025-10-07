import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Добавим отладку
    console.log('=== ROLES GUARD DEBUG ===');
    console.log('User role from token:', user.role);
    console.log('Required roles:', requiredRoles);
    console.log('Access granted:', requiredRoles.includes(user.role));
    console.log('=== END DEBUG ===');

    return requiredRoles.includes(user.role);
  }
}
