import { z } from 'zod';

/**
 * Zod validation schema for Find My Berth query
 */
export const findBerthsQuerySchema = z.object({
  from: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Origin station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  to: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'Destination station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  passengers: z.coerce.number().int().min(1).max(6).default(1),
  train: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Train number must be 5 digits')
    .optional(),
  class: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Class must be alphanumeric')
    .transform((v) => v.toUpperCase())
    .optional()
    .default('3A'),
  preference: z
    .enum(['ANY', 'LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER', 'WINDOW', 'AISLE'])
    .optional()
    .default('ANY'),
  sameCoach: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
    .default(true),
  sameBay: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
    .default(false),
  sortBy: z
    .enum(['BEST_MATCH', 'DEPARTURE', 'ARRIVAL', 'DURATION', 'COVERAGE'])
    .optional()
    .default('BEST_MATCH'),
  checkNextDay: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
    .default(false),
  crossClass: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
    .default(false),
});
