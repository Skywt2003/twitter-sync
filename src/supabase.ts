import { createClient } from "@supabase/supabase-js";
import type { AppConfig } from "./config.js";

export function createSupabaseClient(config: AppConfig) {
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      persistSession: false
    }
  });
}
