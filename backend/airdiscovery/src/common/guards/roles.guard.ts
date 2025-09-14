import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const GROUPS_KEY = 'groups';
export const RequireGroups = (...groups: string[]) => SetMetadata(GROUPS_KEY, groups);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredGroups = this.reflector.getAllAndOverride<string[]>(GROUPS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or groups are required, allow access
    if (!requiredRoles && !requiredGroups) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check roles
    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => 
        user['custom:role'] === role
      );
      
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }
    }

    // Check groups
    if (requiredGroups) {
      const userGroups = user['cognito:groups'] || [];
      const hasGroup = requiredGroups.some((group) => 
        userGroups.includes(group)
      );
      
      if (!hasGroup) {
        throw new ForbiddenException(
          `Access denied. Required groups: ${requiredGroups.join(', ')}`
        );
      }
    }

    return true;
  }
}
