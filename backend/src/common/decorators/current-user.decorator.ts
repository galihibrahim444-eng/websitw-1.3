import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts current user payload from request (assumes authentication middleware sets request.user)
 * Usage: @CurrentUser() user
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
