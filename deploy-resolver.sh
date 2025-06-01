#!/bin/bash

# Set up environment variables for AWS deployment
echo "Setting up AWS environment variables..."
source ./set-aws-env.sh

# Navigate to the backend directory
cd packages/cloudwatchlive/backend

# Compile TypeScript to JavaScript
echo "Compiling TypeScript resolvers..."
npx tsc

# Navigate to the deployment package
cd ../../deploy

# Deploy only the CWL stack with minimal updates
echo "Deploying updated resolver..."
yarn deploy:cwl

echo "Deployment complete! The getCWLUser resolver has been updated."
