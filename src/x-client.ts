import type { AppConfig } from "./config.js";

const X_API_BASE = "https://api.twitter.com/2";

export type Media = {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
};

export type Tweet = {
  id: string;
  text: string;
  created_at: string;
  conversation_id?: string;
  attachments?: {
    media_keys?: string[];
  };
};

export type TweetResponse = {
  data?: Tweet[];
  includes?: {
    media?: Media[];
  };
};

export type UserLookupResponse = {
  data: {
    id: string;
    name: string;
    username: string;
  };
};

export async function fetchUserId(config: AppConfig): Promise<UserLookupResponse> {
  const url = new URL(`${X_API_BASE}/users/by/username/${config.username}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.bearerToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`X API error ${response.status}: ${message}`);
  }

  return response.json() as Promise<UserLookupResponse>;
}

export async function fetchUserTweets(
  config: AppConfig,
  userId: string
): Promise<TweetResponse> {
  const url = new URL(`${X_API_BASE}/users/${userId}/tweets`);
  const startTime = new Date(Date.now() - config.syncDays * 24 * 60 * 60 * 1000).toISOString();

  url.searchParams.set("start_time", startTime);
  url.searchParams.set("max_results", "100");
  url.searchParams.set("exclude", "replies,retweets");
  url.searchParams.set("tweet.fields", "created_at,conversation_id,attachments");
  url.searchParams.set("expansions", "attachments.media_keys");
  url.searchParams.set("media.fields", "url,preview_image_url,type");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.bearerToken}`
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`X API error ${response.status}: ${message}`);
  }

  return response.json() as Promise<TweetResponse>;
}
