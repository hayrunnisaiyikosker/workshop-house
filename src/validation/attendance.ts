import { z } from 'zod';

export const manualAttendanceSchema = z.object({
  status: z.enum(['attended', 'absent'], {
    errorMap: () => ({ message: 'Status must be either attended or absent' }),
  }),
});

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;

/** Check-in code: 8 characters from the unambiguous alphabet [A-HJ-NP-Z2-9] */
const CHECKIN_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

export const checkinCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .pipe(
      z
        .string()
        .min(8, 'Check-in code must be 8 characters')
        .max(8, 'Check-in code must be 8 characters')
        .regex(CHECKIN_CODE_PATTERN, 'Invalid check-in code format')
    ),
});

export type CheckinCodeInput = z.infer<typeof checkinCodeSchema>;
