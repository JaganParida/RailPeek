import { z } from 'zod';

export const explainRequestSchema = z.object({
  trainNumber: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, 'Train number must be 4 to 6 digits'),
  trainName: z.string().trim().optional(),
  fromStation: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'From station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  toStation: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,10}$/, 'To station code must be alphanumeric')
    .transform((v) => v.toUpperCase()),
  journeyDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
  travelClass: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,4}$/, 'Travel class must be alphanumeric')
    .transform((v) => v.toUpperCase())
    .optional(),
  coverageStatus: z
    .enum(['FULL_JOURNEY', 'PARTIAL_JOURNEY', 'UNAVAILABLE', 'UNKNOWN'])
    .default('FULL_JOURNEY'),
  coveragePercent: z.number().min(0).max(100).optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  allocatedBerths: z
    .array(
      z.object({
        berthNumber: z.number(),
        berthType: z.string().optional(),
        coach: z.string().optional(),
        bayNumber: z.number().optional(),
        status: z.string().optional(),
        coveragePercent: z.number().optional(),
        availableFrom: z.string().optional(),
        availableTo: z.string().optional(),
        explanation: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  cohesion: z.string().optional(),
  passengerCount: z.number().min(1).max(6).optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});
