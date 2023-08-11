import { z } from 'zod';

export const userUpdatedDto = z.object({
  name: z.string().min(4).max(255).optional(),
  email: z.string().email('Email is not valid. Please provide a valid email address.').optional(),
});

export type UserUpdatedDto = z.infer<typeof userUpdatedDto>;
