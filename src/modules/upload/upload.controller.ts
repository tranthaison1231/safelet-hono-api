import { s3Service } from '@/lib/s3.service';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getPresignedUrlDto } from './dto/upload.dto';

export const router = new Hono();

router.post('/presigned-url', zValidator('json', getPresignedUrlDto), async (c) => {
  const body = c.req.valid('json');
  const data = await s3Service.presignedUrlS3(body);
  return c.json(data, 201);
});
