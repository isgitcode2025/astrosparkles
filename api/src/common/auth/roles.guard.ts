import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../modules/users/user.schema';
import { ROLES_KEY } from './auth.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? [];
    if (required.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user as { roles: Role[] } | undefined;
    if (user && required.some((r) => user.roles.includes(r))) return true;
    throw new ForbiddenException('You do not have access to this action');
  }
}
