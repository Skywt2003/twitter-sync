import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "./config.js";
import type { Media, Tweet, User } from "./x-client.js";

const TABLE_NAME = "tweets";

type StoredTweet = {
  tweet_id: string;
  author_id: string;
  created_at: string;
  text: string;
  conversation_id: string | null;
  thread_root_id: string;
  permalink: string;
  media_urls: string[];
  media_types: string[];
  is_quote: boolean;
  raw: unknown;
};

export async function syncTweets(
  config: AppConfig,
  supabase: SupabaseClient,
  userId: string,
  tweets: Tweet[],
  media: Media[],
  quotedTweets: Tweet[],
  users: User[]
) {
  if (tweets.length === 0) {
    console.log("No tweets found in the sync window.");
    return;
  }

  const mediaByKey = new Map(media.map((item) => [item.media_key, item]));
  const usersById = new Map(users.map((item) => [item.id, item]));
  const threadRoots = computeThreadRoots(tweets);

  const records: StoredTweet[] = tweets.map((tweet) => {
    const mediaKeys = tweet.attachments?.media_keys ?? [];
    const mediaItems = mediaKeys
      .map((key) => mediaByKey.get(key))
      .filter((item): item is Media => Boolean(item));

    const mediaUrls = mediaItems
      .map((item) => item.url ?? item.preview_image_url)
      .filter((url): url is string => Boolean(url));

    const mediaTypes = mediaItems.map((item) => item.type);
    const conversationId = tweet.conversation_id ?? null;
    const threadRootId = threadRoots.get(conversationId ?? tweet.id) ?? tweet.id;

    return {
      tweet_id: tweet.id,
      author_id: userId,
      created_at: tweet.created_at,
      text: tweet.text,
      conversation_id: conversationId,
      thread_root_id: threadRootId,
      permalink: `https://x.com/${config.username}/status/${tweet.id}`,
      media_urls: mediaUrls,
      media_types: mediaTypes,
      is_quote: false,
      raw: { ...tweet, media: mediaItems }
    };
  });

  if (quotedTweets.length > 0) {
    const quotedRecords: StoredTweet[] = quotedTweets.map((tweet) => {
      const author = usersById.get(tweet.author_id ?? "");

      return {
        tweet_id: tweet.id,
        author_id: tweet.author_id ?? "",
        created_at: tweet.created_at,
        text: tweet.text,
        conversation_id: tweet.conversation_id ?? null,
        thread_root_id: tweet.id,
        permalink: author
          ? `https://x.com/${author.username}/status/${tweet.id}`
          : "",
        media_urls: [],
        media_types: [],
        is_quote: true,
        raw: tweet
      };
    });

    records.push(...quotedRecords);
  }

  const uniqueRecords = Array.from(
    new Map(records.map((record) => [record.tweet_id, record])).values()
  );

  const { error } = await supabase.from(TABLE_NAME).upsert(uniqueRecords, {
    onConflict: "tweet_id"
  });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Fetched ${tweets.length} own tweets.`);
  console.log(`Upserted ${records.length} tweets (including quoted).`);
}

function computeThreadRoots(tweets: Tweet[]) {
  const roots = new Map<string, { id: string; createdAt: number }>();

  for (const tweet of tweets) {
    const conversationId = tweet.conversation_id ?? tweet.id;
    const createdAt = Date.parse(tweet.created_at);

    const current = roots.get(conversationId);
    if (!current || createdAt < current.createdAt) {
      roots.set(conversationId, { id: tweet.id, createdAt });
    }
  }

  return new Map(
    Array.from(roots.entries()).map(([conversationId, value]) => [
      conversationId,
      value.id
    ])
  );
}
