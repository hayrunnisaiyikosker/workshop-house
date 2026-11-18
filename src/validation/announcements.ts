import { z } from 'zod';

export const announcementSchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, 'Announcement message must be at least 3 characters long')
    .max(2000, 'Announcement message cannot exceed 2000 characters'),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
