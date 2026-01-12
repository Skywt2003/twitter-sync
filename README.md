# Twitter Sync

Sync your Twitter (X) posts to Supabase daily using GitHub Actions.

## Features

- Daily automatic sync of your original tweets (excludes replies and retweets)
- Configurable sync window (default: last 7 days)
- Stores tweet data including text, media URLs (hotlinked), and full raw JSON
- Uses only your username (user ID is resolved via X API)
- Runs on GitHub Actions with cron scheduling (UTC midnight)
- Supports local HTTP proxy for API access

## Prerequisites

- Twitter (X) Developer account with Bearer Token (Free tier sufficient)
- Supabase project with a PostgreSQL database
- GitHub repository for hosting the workflow

## Setup

### 1. Supabase

Create a `tweets` table in your Supabase database:

```sql
create table if not exists tweets (
  tweet_id text primary key,
  author_id text not null,
  created_at timestamptz not null,
  text text,
  conversation_id text,
  thread_root_id text not null,
  permalink text,
  media_urls text[] not null default '{}',
  media_types text[] not null default '{}',
  raw jsonb
);
```

Note down your Supabase URL and Service Role Key from **Settings → API**.

### 2. Local Development

1. Clone this repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file (see `.env.example`):

```env
X_BEARER_TOKEN=your_bearer_token
X_USERNAME=your_twitter_username
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SYNC_DAYS=7
PROXY_URL=http://127.0.0.1:10800  # optional
```

4. Run the sync manually:

```bash
pnpm sync
```

### 3. GitHub Actions

1. Push this repository to GitHub
2. Add the following Secrets in **Settings → Secrets and variables → Actions**:
   - `X_BEARER_TOKEN` – Your X API Bearer Token
   - `X_USERNAME` – Your Twitter username
   - `SUPABASE_URL` – Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – Your Supabase Service Role Key

3. The workflow runs daily at UTC midnight. You can also trigger it manually from the **Actions** tab.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `X_BEARER_TOKEN` | Yes | Twitter API Bearer Token |
| `X_USERNAME` | Yes | Your Twitter username |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Service Role Key |
| `SYNC_DAYS` | No | Sync window in days (default: 7) |
| `PROXY_URL` | No | Local proxy URL (e.g., `http://127.0.0.1:10800`) |

## Data Schema

The `tweets` table stores:

- `tweet_id` – Primary key (Twitter tweet ID)
- `author_id` – Your Twitter user ID
- `created_at` – Tweet creation time
- `text` – Tweet text
- `conversation_id` – Conversation thread ID
- `thread_root_id` – Root tweet ID in the thread
- `permalink` – Tweet URL
- `media_urls` – Array of media URLs
- `media_types` – Array of media types
- `raw` – Full JSON response from Twitter API

## API Usage

This tool uses **2 API reads per day** on the Twitter Free tier:
1. Resolve user ID from username (`GET /2/users/by/username/:username`)
2. Fetch tweets (`GET /2/users/:id/tweets`)

This is well within the 100 reads/month Free tier limit.

## License

MIT
