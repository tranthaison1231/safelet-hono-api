import { auth } from '@/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { CountryService } from './countries.service';


export const countries = new Hono();

countries.get(
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
      q: z.string().optional(),
    })
  ),
  async (c) => {
    const { page, limit, q } = c.req.valid('query');
    const data = await CountryService.getAll({
      page,
      limit,
      q,
    });
    return c.json(data, 200);
  }
);

