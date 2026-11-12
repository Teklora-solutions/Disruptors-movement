import { z } from 'zod';

export const EventCreateSchema = z.object({
  organisationId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  isPaid: z.boolean().default(false),
  priceKsh: z.number().int().positive().optional(),
});

export type EventCreateDto = z.infer<typeof EventCreateSchema>;

