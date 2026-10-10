import { z } from 'zod';

/**
 * Zod validation schema for Railway Station metadata
 */
export const stationSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zone: z.string().optional().default('IR'),
});

/**
 * Zod validation schema for Route Stop
 */
export const routeStopSchema = z.object({
  stationCode: z.string().min(2).max(10).toUpperCase(),
  stationName: z.string().min(2).max(100),
  stopIndex: z.number().int().nonnegative(),
  arrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^--:--$/),
  departure: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^--:--$/),
  distanceKm: z.number().nonnegative(),
  dayCount: z.number().int().min(1).default(1),
  haltMinutes: z.number().int().nonnegative().default(0),
});

/**
 * Zod validation schema for Train metadata
 */
export const trainSchema = z.object({
  number: z.string().regex(/^\d{5}$/),
  name: z.string().min(3).max(100),
  origin: z.string().min(2).max(10).toUpperCase(),
  originName: z.string().min(2).max(100),
  destination: z.string().min(2).max(10).toUpperCase(),
  destinationName: z.string().min(2).max(100),
  classes: z.array(z.string()).min(1),
  daysOfRun: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
});

/**
 * Zod validation schema for Berth Occupancy Segment
 */
export const occupancySegmentSchema = z.object({
  from: z.string().min(2).max(10).toUpperCase(),
  to: z.string().min(2).max(10).toUpperCase(),
  fromIndex: z.number().int().nonnegative(),
  toIndex: z.number().int().nonnegative(),
});

/**
 * Zod validation schema for Contiguous Segment Span
 */
export const segmentSpanSchema = z.object({
  from: z.string().min(2).max(10).toUpperCase(),
  to: z.string().min(2).max(10).toUpperCase(),
  fromIndex: z.number().int().nonnegative(),
  toIndex: z.number().int().nonnegative(),
  stopCount: z.number().int().nonnegative().optional(),
});

/**
 * Zod validation schema for Berth Detail
 */
export const berthDetailSchema = z.object({
  berthNumber: z.number().int().positive(),
  berthType: z.enum([
    'LOWER',
    'MIDDLE',
    'UPPER',
    'SIDE_LOWER',
    'SIDE_UPPER',
    'CABIN_LOWER',
    'CABIN_UPPER',
    'WINDOW',
    'AISLE',
  ]),
  coach: z.string().min(2).max(10),
  class: z.string().min(2).max(5),
  bayNumber: z.number().int().positive(),
  status: z.enum(['FULL_JOURNEY', 'PARTIAL_JOURNEY', 'UNAVAILABLE', 'UNKNOWN']),
  coveragePercent: z.number().min(0).max(100),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  availableSegments: z.array(segmentSpanSchema).optional().default([]),
  occupiedSegments: z.array(segmentSpanSchema).optional().default([]),
  occupancySegments: z.array(occupancySegmentSchema).default([]),
  reasons: z.array(z.string()).default([]),
  isBoardingAvailable: z.boolean().optional(),
  isDeboardingAvailable: z.boolean().optional(),
  explanation: z.string().optional(),
});

/**
 * Zod validation schema for Query Availability
 */
export const availabilityQuerySchema = z.object({
  trainNumber: z.string().trim().regex(/^\d{5}$/, 'Train number must be 5 digits'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
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
  class: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Class must be alphanumeric')
    .transform((v) => v.toUpperCase())
    .optional()
    .default('3A'),
  coach: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Coach must be alphanumeric')
    .transform((v) => v.toUpperCase())
    .optional(),
  quota: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Quota must be alphanumeric')
    .transform((v) => v.toUpperCase())
    .optional()
    .default('GN'),
  refresh: z.enum(['true', 'false']).optional().default('false'),
});

/**
 * Zod validation schema for Inbound Provider Availability Result
 */
export const availabilityResultSchema = z.object({
  trainNumber: z.string().regex(/^\d{5}$/),
  trainName: z.string().optional(),
  journeyDate: z.string(),
  from: z.string(),
  to: z.string(),
  travelClass: z.string(),
  coach: z.string().optional(),
  berths: z.array(berthDetailSchema),
  chartStatus: z.string().default('UNKNOWN'),
  source: z.enum(['live', 'cache', 'demo']),
  isDemo: z.boolean().default(false),
  fetchedAt: z.string(),
});
