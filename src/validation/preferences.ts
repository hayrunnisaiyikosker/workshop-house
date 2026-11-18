import { z } from 'zod';

export const preferencesSchema = z.object({
  text_scale: z.enum(['100', '125', '150'], {
    errorMap: () => ({ message: 'Text scale must be 100%, 125%, or 150%' }),
  }),
  high_contrast: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === 'on'),
  reduced_motion: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === 'on'),
  shortcuts_enabled: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === 'on'),
});

export type PreferencesInput = z.infer<typeof preferencesSchema>;
