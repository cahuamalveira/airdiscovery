import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Decorator to extract the current user from the request
 * Usage: @CurrentUser() user: AuthenticatedRequest['user']
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

/**
 * Decorator to extract the access token from the request
 * Usage: @AccessToken() token: string
 */
export const AccessToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.accessToken;
  },
);
