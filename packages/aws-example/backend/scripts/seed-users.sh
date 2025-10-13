#!/bin/bash
set -x  # Enable shell debug mode

# Always start in mono-repo root so .env and all relative paths work
MONOREPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$MONOREPO_ROOT"
DEBUG_LOG="/tmp/seed-users-debug.log"
exec 3>&1 4>&2
exec 1> >(tee -a "$DEBUG_LOG" >&3) 2> >(tee -a "$DEBUG_LOG" >&4)
echo "[DEBUG] Script started at $(date)"
echo "[DEBUG] Current working directory: $(pwd)"
echo "[DEBUG] User: $(whoami)"
echo "[DEBUG] PATH: $PATH"
echo "[DEBUG] Node version: $(node --version 2>/dev/null || echo 'not found')"
echo "[DEBUG] Yarn version: $(yarn --version 2>/dev/null || echo 'not found')"
echo "[DEBUG] AWS CLI version: $(aws --version 2>&1 || echo 'not found')"
echo "[DEBUG] Environment variables:"
env | grep -E 'AWS|STAGE|TABLE|NODE|YARN' | sort

# Script to seed DynamoDB with simple test users
# This script uses DETERMINISTIC UUIDs - the same emails always generate the same UUIDs
# This allows other repos to reference these users by email/UUID
# Usage: ./seed-users.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 AWS Example User Seeding Script${NC}"
echo "[DEBUG] Script directory: $(dirname "$0")"
echo ""

# Check for AWS CLI and credentials, but do not fail if aws CLI is missing or broken.
# The seeding implementation uses the Node AWS SDK (via yarn scripts) and will use
# environment variables if present. This check is only advisory to help debug
# local environments where aws CLI is available but misconfigured.
if command -v aws > /dev/null 2>&1; then
    if aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${GREEN}✅ AWS CLI and credentials verified${NC}"
    else
        echo -e "${YELLOW}⚠️  AWS CLI found but could not verify credentials. Proceeding; the seeder will rely on AWS SDK and environment variables.${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  AWS CLI not found. Proceeding; the seeder will rely on AWS SDK and environment variables.${NC}"
fi

# Get current AWS region
AWS_REGION=${AWS_REGION:-$(aws configure get region)}
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="ap-southeast-2"
fi

# Get stage from environment or use default
STAGE=${STAGE:-"dev"}

# Get table name from CloudFormation exports or use default
TABLE_NAME=$(aws cloudformation list-exports \
    --region "$AWS_REGION" \
    --query "Exports[?Name=='awseUserTableName-${STAGE}'].Value" \
    --output text 2>/dev/null || echo "nlmonorepo-awse-datatable-${STAGE}")

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Region:      ${YELLOW}${AWS_REGION}${NC}"
echo -e "  Stage:       ${YELLOW}${STAGE}${NC}"
echo -e "  Table:       ${YELLOW}${TABLE_NAME}${NC}"
echo -e "  Total Users: ${YELLOW}6${NC} (fixed)"
echo -e "  UUID Mode:   ${YELLOW}Deterministic${NC} (same every time)"
if [ -n "$SUPER_ADMIN_USER_ID" ]; then
    echo -e "  Super Admin ID: ${YELLOW}${SUPER_ADMIN_USER_ID}${NC}"
fi
echo ""

echo -e "${YELLOW}Proceeding with seeding automatically${NC}"
echo "[DEBUG] Proceeding with seeding automatically"

# Run the TypeScript script
echo ""
echo -e "${BLUE}Running seeding script...${NC}"
echo ""

echo "[DEBUG] About to run seeding script with AWS_REGION=$AWS_REGION, TABLE_NAME=$TABLE_NAME, STAGE=$STAGE"
export AWS_REGION="$AWS_REGION"
export TABLE_NAME="$TABLE_NAME"
export STAGE="$STAGE"

# Stay in mono-repo root so .env is always found
echo "[DEBUG] Staying in mono-repo root: $(pwd)"
ls -al packages/aws-example/backend/scripts

# Use yarn to run the seeding script with local dependencies
if command -v yarn &> /dev/null; then
    echo "[DEBUG] Running: yarn --cwd packages/aws-example/backend run seed:users"
    if yarn --cwd packages/aws-example/backend run seed:users; then
        echo "[DEBUG] yarn --cwd packages/aws-example/backend run seed:users succeeded"
    else
        echo "[DEBUG] yarn --cwd failed, attempting yarn workspace fallback"
        # Try workspace command (works if workspace name is correct)
        if yarn workspace awsebackend run seed:users; then
            echo "[DEBUG] yarn workspace awsebackend run seed:users succeeded"
        else
            echo -e "${RED}❌ Failed to run seed:users via yarn${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Yarn is not installed!${NC}"
    echo "[DEBUG] Yarn is not installed!"
    echo "Please install yarn to run this script."
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"
