#!/bin/bash
# Update .env.local with values from CloudFormation stack outputs
# Usage: ./scripts/update-env-from-aws.sh [stage]

STAGE="${1:-dev}"
STACK_NAME="nlmonorepo-thestoryhub-${STAGE}"
ENV_FILE="$(dirname "$0")/../.env.local"

echo "📝 Fetching CloudFormation outputs from stack: $STACK_NAME"

# Source AWS credentials
source ../../../set-aws-env.sh

# Get outputs from CloudFormation
USER_POOL_ID=$(/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/.local-aws/v2/2.27.45/dist/aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --no-verify-ssl 2>/dev/null)

USER_POOL_CLIENT_ID=$(/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/.local-aws/v2/2.27.45/dist/aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text \
  --no-verify-ssl 2>/dev/null)

IDENTITY_POOL_ID=$(/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/.local-aws/v2/2.27.45/dist/aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue' \
  --output text \
  --no-verify-ssl 2>/dev/null)

GRAPHQL_URL=$(/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/.local-aws/v2/2.27.45/dist/aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`AppSyncApiUrl`].OutputValue' \
  --output text \
  --no-verify-ssl 2>/dev/null)

# Check if all values were retrieved
if [ -z "$USER_POOL_ID" ] || [ -z "$USER_POOL_CLIENT_ID" ] || [ -z "$IDENTITY_POOL_ID" ] || [ -z "$GRAPHQL_URL" ]; then
  echo "❌ Error: Could not retrieve all required values from CloudFormation stack"
  echo "   Make sure the stack $STACK_NAME exists and has the required outputs"
  exit 1
fi

# Write to .env.local
cat > "$ENV_FILE" <<EOF
# Auto-generated from CloudFormation outputs
# Stack: $STACK_NAME
# Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_IDENTITY_POOL_ID=$IDENTITY_POOL_ID
NEXT_PUBLIC_GRAPHQL_URL=$GRAPHQL_URL
NEXT_PUBLIC_ENVIRONMENT=$STAGE
EOF

echo "✅ Successfully updated $ENV_FILE"
echo ""
echo "📋 Configuration:"
echo "   User Pool ID: $USER_POOL_ID"
echo "   User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "   Identity Pool ID: $IDENTITY_POOL_ID"
echo "   GraphQL URL: $GRAPHQL_URL"
echo "   Environment: $STAGE"
