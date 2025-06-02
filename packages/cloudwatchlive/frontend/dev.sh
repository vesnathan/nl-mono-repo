#!/bin/bash

# Ensure the dev server runs in development mode without static export
export NODE_ENV=development
export NEXT_PUBLIC_ENVIRONMENT=nldev

# Run the Next.js dev server with host flag to make it accessible from outside the container
yarn dev -H 0.0.0.0
