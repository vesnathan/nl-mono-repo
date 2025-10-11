#!/bin/bash

echo "🧹 Cleaning Next.js cache..."
rm -rf .next

echo "🔍 Killing any existing Next.js processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "🧹 Clearing Node.js cache..."
rm -rf node_modules/.cache

echo "✅ Cleanup complete!"
echo "🚀 Starting dev server with increased memory..."

# Ensure the dev server runs in development mode
export NODE_ENV=development
export NEXT_PUBLIC_ENVIRONMENT=dev
export NODE_OPTIONS="--max-old-space-size=4096"

# Run the Next.js dev server on port 3001 (agent-specific)
yarn dev -- -p 3001 -H 0.0.0.0
