import { auth } from '@/middlewares/auth';
import { role } from '@/middlewares/role';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { UserService } from './users.service';

export const users = new Hono();

users.get(
  '/',
  auth,
  role(['admin']),
  zValidator(
    'param',
    z.object({
      page: z.string().optional(),
      // .transform((v) => parseInt(v))
      // .refine((v) => !isNaN(v), { message: 'Not a number' })
      limit: z.string().optional(),
      // .transform((v) => parseInt(v))
      // .refine((v) => !isNaN(v), { message: 'Not a number' }),
    })
  ),
  async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const data = await UserService.getAll(page, limit);
    return c.json(data, 200);
  }
);

users.delete('/:id', auth, async (c) => {
  const id = c.req.param('id');
  const data = await UserService.delete(id);
  return c.json(data, 200);
});

users.get('/:id', auth, async (c) => {
  const id = c.req.param('id');
  const data = await UserService.getBy(id);
  if (!data) {
    return c.json(
      {
        message: 'User not found',
      },
      404
    );
  }
  return c.json(data, 200);
});
