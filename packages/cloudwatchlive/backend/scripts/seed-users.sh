#!/bin/bash

# Script to seed DynamoDB with FIXED CWL users (Event Companies with hierarchical structure)
# This script uses DETERMINISTIC UUIDs - the same names always generate the same UUIDs
# This allows other repos to reference these users by email/UUID
# Usage: ./seed-users.sh
# No parameters needed - creates 5 companies with 100 users total (all predefined)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 CWL User Seeding Script${NC}"
echo ""

# Check if AWS credentials are configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo "Please configure your AWS credentials first."
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified${NC}"

# No parameters needed - all data is fixed and deterministic!

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
    --query "Exports[?Name=='cwlUserTableName-${STAGE}'].Value" \
    --output text 2>/dev/null || echo "nlmonorepo-shared-usertable-${STAGE}")

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Region:          ${YELLOW}${AWS_REGION}${NC}"
echo -e "  Stage:           ${YELLOW}${STAGE}${NC}"
echo -e "  Table:           ${YELLOW}${TABLE_NAME}${NC}"
echo -e "  Event Companies: ${YELLOW}5${NC} (fixed)"
echo -e "  Total Users:     ${YELLOW}~100${NC} (fixed)"
echo -e "  UUID Mode:       ${YELLOW}Deterministic${NC} (same every time)"
echo -e "  Total Users:        ${YELLOW}$((NUM_COMPANIES * (1 + ADMINS_PER_COMPANY + ADMINS_PER_COMPANY * STAFF_PER_ADMIN)))${NC}"
if [ -n "$SUPER_ADMIN_USER_ID" ]; then
    echo -e "  Super Admin ID:     ${YELLOW}${SUPER_ADMIN_USER_ID}${NC}"
fi
echo ""

# Confirm before proceeding
read -p "Continue with seeding? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Seeding cancelled${NC}"
    exit 0
fi

# Run the TypeScript script
echo ""
echo -e "${BLUE}Running seeding script...${NC}"
echo ""

export AWS_REGION="$AWS_REGION"
export TABLE_NAME="$TABLE_NAME"
export STAGE="$STAGE"

# Change to the backend directory
cd "$(dirname "$0")/.."

# Run using ts-node or npx tsx (no parameters needed - all data is fixed!)
if command -v tsx &> /dev/null; then
    tsx scripts/seed-users.ts
elif command -v ts-node &> /dev/null; then
    ts-node scripts/seed-users.ts
else
    echo -e "${RED}❌ Neither tsx nor ts-node found!${NC}"
    echo "Please install one of them:"
    echo "  yarn global add tsx"
    echo "  or"
    echo "  yarn global add ts-node"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"
