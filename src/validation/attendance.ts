import { z } from 'zod';

export const manualAttendanceSchema = z.object({
  status: z.enum(['attended', 'absent'], {
    errorMap: () => ({ message: 'Status must be either attended or absent' }),
  }),
});

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;

export const checkinCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Check-in code is required')
    .max(20, 'Check-in code is too long'),
});

export type CheckinCodeInput = z.infer<typeof checkinCodeSchema>;
