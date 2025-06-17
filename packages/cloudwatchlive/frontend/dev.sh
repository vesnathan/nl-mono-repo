#!/bin/bash

# Ensure the dev server runs in development mode without static export
export NODE_ENV=development
export NEXT_PUBLIC_ENVIRONMENT=dev

# Run the Next.js dev:codespaces script
yarn dev:codespaces
