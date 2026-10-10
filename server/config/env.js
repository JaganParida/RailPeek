import dns from 'dns';
import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure reliable DNS servers on Windows/local environments for Atlas shard lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  RAILWAY_PROVIDER: z.enum(['mock', 'live']).default('mock'),
  RAILWAY_API_KEY: z.string().optional().default(''),
  RAILWAY_API_URL: z.string().optional().default(''),
  RAILWAY_API_HOST: z.string().optional().default(''),
  LIVE_PROVIDER_FALLBACK_TO_DEMO: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Safe logging without exposing secrets
  console.error('[RailPeek Config] Invalid environment configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
