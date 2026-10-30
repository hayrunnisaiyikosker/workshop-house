import { z } from 'zod';

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Course title must be at least 3 characters long')
    .max(200, 'Course title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Course description must be at least 10 characters long')
    .max(2000, 'Course description cannot exceed 2000 characters'),
});

export type CourseInput = z.infer<typeof courseSchema>;
