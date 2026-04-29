/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../modules/auth/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(
      `Required roles: ${requiredRoles ? requiredRoles.join(', ') : 'None'}`,
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn(`Authorization failed: No user found in request`);
      throw new ForbiddenException('Access denied: No user found');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    this.logger.debug(
      `Checking role for user ${user.id}: required=[${requiredRoles.join(', ')}], actual=${user.role}, hasRole=${hasRole}`,
    );

    if (!hasRole) {
      this.logger.warn(
        `Authorization failed for user ${user.id}: Insufficient permissions`,
      );
      throw new ForbiddenException('Access denied: Insufficient permissions');
    }

    return true;
  }
}
