#!/bin/bash
# Script to load AWS credentials from mono-repo root .env file into current terminal

# Path to the root .env file (used for all deployments in mono-repo)
ROOT_ENV_FILE="../../.env"

# Function to safely exit/return based on how script is called
safe_exit() {
    if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
        # Script is being sourced, use return
        return $1
    else
        # Script is being executed, use exit
        exit $1
    fi
}

# Check if the .env file exists
if [ ! -f "$ROOT_ENV_FILE" ]; then
    echo "❌ .env file not found at $ROOT_ENV_FILE"
    echo "💡 Create a .env file in the mono-repo root with AWS credentials"
    echo "💡 Or run 'cd ../deploy && yarn deploy' to set up credentials"
    safe_exit 1
fi

echo "🔑 Loading AWS credentials from mono-repo root..."
source "$ROOT_ENV_FILE"

# Verify credentials are loaded
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not found in .env file"
    echo "💡 The .env file should contain AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "💡 Current .env contains: AWS_ACCOUNT_ID, STAGE, AWS_REGION"
    echo "💡 Missing: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    safe_exit 1
fi

# Export the variables so they're available to child processes
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_ACCOUNT_ID
export AWS_REGION="${AWS_REGION:-ap-southeast-2}"

echo "✅ AWS credentials loaded successfully"
echo "🌍 Region: $AWS_REGION"
echo "🔑 Access Key: ${AWS_ACCESS_KEY_ID:0:8}..."
echo ""
echo "You can now run AWS CLI commands or the ec2-vsc scripts:"
echo "  aws sts get-caller-identity"
echo "  yarn menu"
echo "  yarn deployment-menu"
