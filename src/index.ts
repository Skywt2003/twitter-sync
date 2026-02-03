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

  const { data: lastTweet } = await supabase
    .from("tweets")
    .select("tweet_id, created_at")
    .eq("is_quote", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lastTweet && lastTweet[0]) {
    const lastCreatedAt = new Date(lastTweet[0].created_at);
    const daysSinceLastSync = (Date.now() - lastCreatedAt.getTime()) / (24 * 60 * 60 * 1000);

    if (daysSinceLastSync < config.syncIntervalDays) {
      console.log(`Skipping sync: last sync was ${Math.floor(daysSinceLastSync)} days ago (interval: ${config.syncIntervalDays} days).`);
      return;
    }
  }

  const userLookup = await fetchUserId(config);
  const userId = userLookup.data.id;

  const sinceId = lastTweet?.[0]?.tweet_id;

  const response = await fetchUserTweets(config, userId, sinceId);
  const tweets = response.data ?? [];
  const media = response.includes?.media ?? [];
  const quotedTweets = response.includes?.tweets ?? [];
  const users = response.includes?.users ?? [];

  await syncTweets(config, supabase, userId, tweets, media, quotedTweets, users);
}

run().catch((error) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
