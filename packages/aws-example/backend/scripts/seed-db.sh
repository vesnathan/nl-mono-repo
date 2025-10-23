#!/bin/bash
set -x  # Enable shell debug mode

# Always start in mono-repo root so .env and all relative paths work
MONOREPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$MONOREPO_ROOT"
DEBUG_LOG="/tmp/seed-db-debug.log"
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
# Usage: ./seed-db.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 AWS Example Data Seeding Script${NC}"
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

# Try to read parameterized outputs from deployment-outputs.json first (preferred).
# If that fails, fall back to CloudFormation exports (legacy) and then a sensible default.
TABLE_NAME=""

# Attempt to read deployment-outputs.json using node (quietly)
TABLE_NAME=$(node -e "const fs=require('fs'); const path=require('path'); const stage=process.argv[1]; try{ const p=path.join(__dirname,'../../../../deploy/deployment-outputs.json'); const content=fs.readFileSync(p,'utf8'); const obj=JSON.parse(content); const stack=obj.stacks && obj.stacks['AwsExample']; if(stack && stack.outputs){ for(const out of stack.outputs){ const en=(out.ExportName||'').toLowerCase(); const ok=(out.OutputKey||'').toLowerCase(); if(en.includes('datatable')||ok.includes('datatable')||ok.includes('datatablename')){ console.log(out.OutputValue); process.exit(0);} } } process.exit(1);}catch(e){ process.exit(1);}" "$STAGE" 2>/dev/null || true)

if [ -z "$TABLE_NAME" ]; then
    # Fallback to legacy CloudFormation export
    TABLE_NAME=$(aws cloudformation list-exports \
        --region "$AWS_REGION" \
        --query "Exports[?Name=='awseUserTableName-${STAGE}'].Value" \
        --output text 2>/dev/null || echo "nlmonorepo-awse-datatable-${STAGE}")
fi

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
    echo "[DEBUG] Running: yarn --cwd packages/aws-example/backend run seed"
    if yarn --cwd packages/aws-example/backend run seed; then
        echo "[DEBUG] yarn --cwd packages/aws-example/backend run seed succeeded"
    else
        echo "[DEBUG] yarn --cwd failed, attempting yarn workspace fallback"
        # Try workspace command (works if workspace name is correct)
        if yarn workspace awsebackend run seed; then
            echo "[DEBUG] yarn workspace awsebackend run seed succeeded"
        else
            echo -e "${RED}❌ Failed to run seed via yarn${NC}"
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

# Check if AWS credentials are configured via environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    echo "Please configure your AWS credentials first."
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials verified (via environment variables)${NC}"

# Get current AWS region from environment or use default
AWS_REGION=${AWS_REGION:-"ap-southeast-2"}

# Get stage from environment or use default
STAGE=${STAGE:-"dev"}

# Get table name from environment or CloudFormation exports or use default
if [ -n "$TABLE_NAME" ]; then
    echo "[DEBUG] Using TABLE_NAME from environment: $TABLE_NAME"
else
    # Try to get from CloudFormation if AWS CLI is available
    if command -v aws &> /dev/null && aws --version &> /dev/null; then
        TABLE_NAME=$(aws cloudformation list-exports \
            --region "$AWS_REGION" \
            --query "Exports[?Name=='awse-DataTableName-${STAGE}'].Value" \
            --output text 2>/dev/null || echo "nlmonorepo-awse-datatable-${STAGE}")
    else
        # AWS CLI not available, use default naming convention
        TABLE_NAME="nlmonorepo-awse-datatable-${STAGE}"
        echo "[DEBUG] AWS CLI not available, using default table name: $TABLE_NAME"
    fi
fi

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
        if yarn workspace awsebackend run seed:db; then
            echo "[DEBUG] yarn workspace awsebackend run seed:db succeeded"
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
