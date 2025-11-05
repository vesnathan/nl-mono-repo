#!/bin/bash
# Force update all Lambda functions from S3
# This is a workaround for CloudFormation not detecting S3 file content changes

set -e

STAGE=${1:-dev}
REGION=${2:-ap-southeast-2}

echo "Force updating Lambda functions for stage: $STAGE"

# Source AWS credentials
source "$(dirname "$0")/../../../set-aws-env.sh"

# List of Lambda functions to update
FUNCTIONS=(
  "nlmonorepo-thestoryhub-update-patreon-secrets-$STAGE"
  "nlmonorepo-thestoryhub-patreon-oauth-$STAGE"
  # Add more functions here as needed
)

AWS_CMD="/home/liqk1ugzoezh5okwywlr_/dev/nl-mono-repo-agent-1/.local-aws/v2/2.27.45/dist/aws"

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
  echo "Updating $FUNCTION_NAME..."
  $AWS_CMD lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --s3-bucket "nlmonorepo-thestoryhub-templates-$STAGE" \
    --s3-key "functions/$STAGE/$(echo $FUNCTION_NAME | sed "s/nlmonorepo-thestoryhub-//;s/-$STAGE//").zip" \
    --no-verify-ssl \
    --region "$REGION" \
    2>&1 | grep -v "InsecureRequestWarning" || true
  echo "✓ Updated $FUNCTION_NAME"
done

echo "All Lambda functions updated!"
