#!/bin/bash
set -x

# Always start in mono-repo root
MONOREPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$MONOREPO_ROOT"

echo "[DEBUG] Script started at $(date)"
echo "[DEBUG] Current working directory: $(pwd)"

# Script to seed DynamoDB with AWS Example test users
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌱 AWS Example DB Seeding Script${NC}"
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo "Please configure your AWS credentials first."
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified${NC}"

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
    --query "Exports[?Name=='awsb-DataTableName-${STAGE}'].Value" \
    --output text 2>/dev/null || echo "nlmonorepo-awsb-datatable-${STAGE}")

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Region:      ${YELLOW}${AWS_REGION}${NC}"
echo -e "  Stage:       ${YELLOW}${STAGE}${NC}"
echo -e "  Table:       ${YELLOW}${TABLE_NAME}${NC}"
echo ""

echo -e "${BLUE}Running seeding script...${NC}"
echo ""

export AWS_REGION="$AWS_REGION"
export TABLE_NAME="$TABLE_NAME"
export STAGE="$STAGE"

# Use yarn to run the seeding script
if command -v yarn &> /dev/null; then
    echo "[DEBUG] Running: yarn --cwd packages/aws-example/backend run seed:db"
    if yarn --cwd packages/aws-example/backend run seed:db; then
        echo "[DEBUG] Seeding succeeded"
    else
        echo "[DEBUG] yarn --cwd failed, attempting yarn workspace fallback"
        if yarn workspace awsbbackend run seed:db; then
            echo "[DEBUG] yarn workspace awsbbackend run seed:db succeeded"
        else
            echo -e "${RED}❌ Failed to run seed:db via yarn${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Yarn is not installed!${NC}"
    echo "Please install yarn to run this script."
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"
