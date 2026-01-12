import { z } from "zod";

const envSchema = z.object({
  X_BEARER_TOKEN: z.string().min(1),
  X_USERNAME: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SYNC_DAYS: z.string().optional().default("7"),
  PROXY_URL: z.string().optional()
});

export type AppConfig = {
  bearerToken: string;
  username: string;
  supabaseUrl: string;
  supabaseKey: string;
  syncDays: number;
  proxyUrl?: string;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.parse(process.env);
  const syncDays = Number.parseInt(parsed.SYNC_DAYS, 10);

  if (!Number.isFinite(syncDays) || syncDays <= 0) {
    throw new Error("SYNC_DAYS must be a positive integer");
  }

  return {
    bearerToken: parsed.X_BEARER_TOKEN,
    username: parsed.X_USERNAME,
    supabaseUrl: parsed.SUPABASE_URL,
    supabaseKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    syncDays,
    proxyUrl: parsed.PROXY_URL
  };
}
