import { z } from 'zod';

export const coachVacancyQuerySchema = z.object({
  trainNumber: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, 'Train number must be 4 to 6 digits'),
  coachId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,5}$/, 'Coach identifier must be 2 to 5 alphanumeric characters')
    .transform((val) => val.toUpperCase()),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
  from: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'From station code must be alphanumeric')
    .transform((val) => val.toUpperCase())
    .optional(),
  to: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'To station code must be alphanumeric')
    .transform((val) => val.toUpperCase())
    .optional(),
  travelClass: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Travel class must be alphanumeric')
    .transform((val) => val.toUpperCase())
    .optional(),
});
