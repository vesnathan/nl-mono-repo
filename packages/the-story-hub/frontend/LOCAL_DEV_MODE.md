# Local Development Mode

When the database or backend services are unavailable, the frontend can fall back to using local seed data for development.

## Features

- **Automatic fallback**: API errors automatically fall back to local data
- **Visual indicator**: Big red banner at the top shows you're in local mode
- **Seed data**: Uses simplified version of backend seed data
- **No database required**: Develop and test UI without backend deployment

## How to Enable

### Method 1: Environment Variable (Forced Local Mode)

Set the environment variable to force local mode even if backend is available:

```bash
# In your terminal before starting dev server
export NEXT_PUBLIC_USE_LOCAL_DATA=true
yarn dev
```

Or add to your `.env.local` file:

```bash
NEXT_PUBLIC_USE_LOCAL_DATA=true
```

### Method 2: Automatic Fallback

If the backend is down or unreachable, the API layer will automatically fall back to local data. You'll see the red banner and error messages in console.

## What Works in Local Mode

Currently supported:
- **Story listing**: Homepage will show 2 seed stories
- **Story detail**: Can view story details
- **Comments**: Shows sample comments for nodes

## What's Available in Seed Data

The local data includes:

**Users:**
- TheStoryteller (admin, OG supporter)
- CyberScribe (Patreon, OG supporter)
- MysteryWriter (Patreon supporter)
- DragonQuill (regular user)

**Stories:**
- The Enchanted Forest (Fantasy/Adventure)
- Transcendence (Sci-Fi/Thriller)

**Sample Comments:**
- One comment on "The Enchanted Forest"

## Extending Local Data

To add more local data, edit:
```
packages/the-story-hub/frontend/src/lib/local-data/index.ts
```

Add new stories, users, comments, etc. to the `LOCAL_DATA` object.

## Visual Indicator

When in local mode, a prominent red banner appears at the top:

```
⚠ LOCAL DEVELOPMENT MODE - Using Seed Data (Database Unavailable)
```

This ensures you always know when you're working with local data vs. real backend data.

## Disabling Local Mode

Remove the environment variable or set it to `false`:

```bash
export NEXT_PUBLIC_USE_LOCAL_DATA=false
yarn dev
```

Or remove from `.env.local` and restart the dev server.
