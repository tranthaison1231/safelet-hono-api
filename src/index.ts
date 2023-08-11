import { router as auth } from '@/modules/auth/auth.controller';
import { router as upload } from '@/modules/upload/upload.controller';
import { users } from '@/modules/users/users.controller';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorFilter } from './middlewares/error-filter';

const bootstrap = async () => {
  try {
    const app = new Hono().basePath('/api');

    app.use('*', logger());
    app.use(
      '*',
      cors({
        origin: '*',
        credentials: true,
      })
    );
    app.route('/', auth);
    app.route('/users', users);
    app.route('/upload', upload);

    app.notFound((c) => {
      return c.json({ status: 404, message: 'Not Found' }, 404);
    });

    app.onError(errorFilter);
    serve(app);
  } catch (error) {
    console.error('Failed to connect to the Mongo server!!');
    console.log(error);
    throw error;
  }
};

bootstrap();
