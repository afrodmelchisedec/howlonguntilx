import { z } from 'zod';

export const timerSchema = z.object({
  name: z.string().min(1).max(100),
  targetDate: z.string().datetime(),
  category: z.string().default('personal'),
});

export type TimerInput = z.infer<typeof timerSchema>;

const userEventBaseSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300),
  targetDate: z.string().datetime(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).max(4).optional(),
});

export const userEventCreateSchema = userEventBaseSchema.refine(
  data => new Date(data.targetDate) > new Date(),
  { message: 'targetDate must be in the future', path: ['targetDate'] }
);

export const userEventUpdateSchema = userEventBaseSchema.partial();

export const commentSubjectTypeEnum = z.enum(['article', 'event', 'userEvent', 'tool']);

export const commentCreateSchema = z.object({
  subjectType: commentSubjectTypeEnum,
  subjectId: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().min(1).max(1000),
});


export type UserEventInput = z.infer<typeof userEventBaseSchema>;
export type UserEventUpdateInput = z.infer<typeof userEventUpdateSchema>;
