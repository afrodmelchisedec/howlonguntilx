import { z } from 'zod';

export const timerSchema = z.object({
  name: z.string().min(1).max(100),
  targetDate: z.string().datetime(),
  category: z.string().default('personal'),
});

export type TimerInput = z.infer<typeof timerSchema>;
