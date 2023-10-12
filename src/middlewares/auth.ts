import { redisService } from '@/lib/redis.service';
import { UnauthorizedException } from '@/utils/exceptions';
import prisma from '@/utils/prisma';
import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

export const auth = async (c: Context, next: Next) => {
  const authHeader = c.req.raw.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedException('Unauthorized');
  }
  const jwtObject = jwt.decode(token) as { userId: string };
  const userID = jwtObject?.userId;
  const jwtSecret = await redisService.get(`jwt-secret:${userID}`);
  try {
    if (!jwtSecret) {
      throw new UnauthorizedException('Unauthorized');
    }
    const data = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });
    c.set('user', user);
    await next();
  } catch (error) {
    throw new UnauthorizedException('Unauthorized');
  }
};
