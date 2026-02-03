import { z } from "zod";

const envSchema = z.object({
  X_BEARER_TOKEN: z.string().min(1),
  X_USERNAME: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SYNC_INTERVAL_DAYS: z.string().optional().default("5"),
  PROXY_URL: z.string().optional()
});

export type AppConfig = {
  bearerToken: string;
  username: string;
  supabaseUrl: string;
  supabaseKey: string;
  syncIntervalDays: number;
  proxyUrl?: string;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  const syncIntervalDays = Number.parseInt(parsed.SYNC_INTERVAL_DAYS, 10);

  if (!Number.isFinite(syncIntervalDays) || syncIntervalDays <= 0) {
    throw new Error("SYNC_INTERVAL_DAYS must be a positive integer");
  }

  return {
    bearerToken: parsed.X_BEARER_TOKEN,
    username: parsed.X_USERNAME,
    supabaseUrl: parsed.SUPABASE_URL,
    supabaseKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    syncIntervalDays,
    proxyUrl: parsed.PROXY_URL
  };
}
