import "dotenv/config";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { loadConfig } from "./config.js";
import { createSupabaseClient } from "./supabase.js";
import { syncTweets } from "./sync.js";
import { fetchUserId, fetchUserTweets } from "./x-client.js";

async function run() {
  const config = loadConfig();

  if (config.proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(config.proxyUrl));
  }

  const supabase = createSupabaseClient(config);

  const userLookup = await fetchUserId(config);
  const userId = userLookup.data.id;

  const response = await fetchUserTweets(config, userId);
  const tweets = response.data ?? [];
  const media = response.includes?.media ?? [];

  await syncTweets(config, supabase, userId, tweets, media);
}

run().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
