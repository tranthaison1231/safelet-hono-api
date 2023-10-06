import { auth } from '@/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { UserService } from './users.service';
import { userUpdatedDto } from './dto/user-payload.dto';

export const users = new Hono();

users.get(
  '/',
  auth,
  // role(['admin']),
  zValidator(
    'query',
    z.object({
      page: z
        .string()
        .transform((v) => parseInt(v))
        .refine((v) => !isNaN(v), { message: 'page must be a number' }),
      limit: z
        .string()
        .transform((v) => parseInt(v))
        .refine((v) => !isNaN(v), { message: 'limit must be a number' }),
      email: z.string().optional(),
      isVerified: z
        .string()
        .optional()
        .transform((v) => (v ? Boolean(v) : undefined)),
    })
  ),
  async (c) => {
    const { page, limit, email, isVerified } = c.req.valid('query');
    const data = await UserService.getAll({
      page,
      limit,
      email,
      isVerified,
    });
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

users.put('/:id', auth, zValidator('json', userUpdatedDto), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const user = await UserService.updateBy(id, data);
  return c.json(user, 200);
});
