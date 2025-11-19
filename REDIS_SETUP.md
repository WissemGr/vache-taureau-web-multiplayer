# 🔴 Upstash Redis Setup Guide

This guide will help you set up persistent storage for your game using Upstash Redis.

## Why Redis?

Your game runs on Vercel serverless functions, which are **stateless**. Without Redis:
- ❌ Game rooms disappear between requests
- ❌ Players can't rejoin games
- ❌ Game state is lost

With Redis:
- ✅ Persistent game state across requests
- ✅ Players can rejoin games
- ✅ Rooms persist for 24 hours
- ✅ Production-ready

## Step 1: Create Free Upstash Account

1. Go to https://console.upstash.com/
2. Sign up with GitHub (or email)
3. It's **100% FREE** for your use case!

## Step 2: Create Redis Database

1. Click **"Create Database"**
2. Choose these settings:
   - **Name**: `vache-taureau-game` (or any name)
   - **Type**: Regional (cheaper, fast enough)
   - **Region**: Choose closest to your users (e.g., `eu-west-1` for Europe)
   - **Eviction**: Enable (to auto-cleanup old data)

3. Click **"Create"**

## Step 3: Get Your Credentials

After creating the database:

1. Click on your database name
2. Scroll to **"REST API"** section
3. You'll see:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA
   ```

## Step 4: Add to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: `web-game`
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   | Name | Value |
   |------|-------|
   | `UPSTASH_REDIS_REST_URL` | `https://xxxxx.upstash.io` |
   | `UPSTASH_REDIS_REST_TOKEN` | `AxxxxxxxxxxxxxxxxxxxA` |

5. Click **"Save"**
6. Redeploy your app (or push new commit)

### Option B: Via Vercel CLI

```bash
vercel env add UPSTASH_REDIS_REST_URL
# Paste your URL when prompted

vercel env add UPSTASH_REDIS_REST_TOKEN
# Paste your token when prompted

# Then redeploy
vercel --prod
```

## Step 5: Verify It's Working

After redeployment:

1. Visit your game: https://web-game-steel.vercel.app
2. Create a room
3. Note the room ID
4. Refresh the page or open in new tab
5. Enter the same room ID → It should work! ✅

## Local Development

For local development, the app will use in-memory storage (no Redis needed).
You'll see this message:
```
ℹ️  No Redis credentials found, using in-memory storage (local dev mode)
```

This is normal and expected!

## Troubleshooting

### "Room not found" error persists

1. Check Vercel logs: `vercel logs --prod`
2. Look for: `✅ Using Upstash Redis for persistent storage`
3. If you see `⚠️  Redis initialization failed`, check your credentials

### Redis not connecting

1. Verify credentials are correct (no extra spaces)
2. Check Upstash dashboard → Database Status (should be "Active")
3. Try creating a new database

## Cost

Upstash Free Tier includes:
- **10,000** commands per day
- **256 MB** storage
- More than enough for your game! 🎮

Your game typically uses:
- ~3-5 commands per player action
- ~1 KB per room

**Estimated capacity**: ~2,000 active players/day on free tier!

## Questions?

- Upstash Docs: https://docs.upstash.com/redis
- Upstash Support: https://upstash.com/discord
