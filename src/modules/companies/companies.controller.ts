import { auth } from '@/middlewares/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { CompanyService } from './companies.service';

export const companies = new Hono();

companies
  .get(
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
      const data = await CompanyService.getAll({
        page,
        limit,
        q,
      });
      return c.json(data, 200);
    }
  )
  .post(
    '/',
    auth,
    // role(['admin']),
    zValidator(
      'json',
      z.object({
        name: z.string(),
        logo: z.string(),
      })
    ),
    async (c) => {
      const { name, logo } = c.req.valid('json');
      const data = await CompanyService.create({
        name,
        logo,
      });
      return c.json(data, 201);
    }
  )
  .put(
    '/:id',
    auth,
    // role(['admin']),
    zValidator(
      'json',
      z.object({
        name: z.string(),
        logo: z.string(),
      })
    ),
    async (c) => {
      const { name, logo } = c.req.valid('json');
      const id = c.req.param('id');
      const data = await CompanyService.updateBy(id, {
        name,
        logo,
      });
      return c.json(data, 200);
    }
  )
  .get('/export-excel', auth, async () => {
    const { data, filename } = await CompanyService.exportExcel();
    return new Response(data, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': ['attachment; filename=', filename, '.csv'].join(''),
      },
    });
  })
  .post('/import-excel', auth, async (c) => {
    const { file } = await c.req.parseBody();
    const buffer = await (file as File).arrayBuffer();
    const data = await CompanyService.importExcel(buffer);
    return c.json(data, 201);
  })
  .delete('/:id', auth, async (c) => {
    const id = c.req.param('id');
    const data = await CompanyService.delete(id);
    return c.json(data, 200);
  });
