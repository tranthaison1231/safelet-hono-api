import { ForbiddenException, UnauthorizedException } from '@/utils/exceptions';
import { Context, Next } from 'hono';

export const role = (roles: string[]) => async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user) {
    throw new UnauthorizedException('Unauthorized');
  }
  if (!roles.includes(user.role)) {
    throw new ForbiddenException('Forbidden');
  }
  await next();
};
