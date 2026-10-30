import { z } from 'zod';

export const sessionSchema = z
  .object({
    course_id: z.string().uuid('Please select a valid course'),
    trainer_id: z.string().uuid('Please select a valid trainer'),
    starts_at: z.string().min(1, 'Start date and time is required'),
    ends_at: z.string().min(1, 'End date and time is required'),
    room: z
      .string()
      .trim()
      .min(1, 'Room is required')
      .max(100, 'Room cannot exceed 100 characters'),
    capacity: z.coerce
      .number({ invalid_type_error: 'Capacity must be a valid number' })
      .int('Capacity must be an integer')
      .positive('Capacity must be greater than 0'),
    resource_url: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val === '' ? undefined : val))
      .pipe(z.string().url('Resource URL must be a valid web address (e.g. https://...)').optional()),
  })
  .refine(
    (data) => {
      const start = new Date(data.starts_at);
      const end = new Date(data.ends_at);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
    },
    {
      message: 'End date and time must be after the start date and time',
      path: ['ends_at'],
    }
  );

export type SessionInput = z.infer<typeof sessionSchema>;

export const trainerResourceSchema = z.object({
  resource_url: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.string().url('Resource URL must be a valid web address (e.g. https://...)').optional()),
});

export type TrainerResourceInput = z.infer<typeof trainerResourceSchema>;
