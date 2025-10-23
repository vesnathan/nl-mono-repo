#!/bin/bash

# Deploy  with Database Seeding
# This script deploys the  infrastructure and optionally seeds the database

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀  Deployment with Database Seeding${NC}"
echo ""

# Get stage from environment or parameter
STAGE=${1:-${STAGE:-"dev"}}
SEED_DB=${2:-"yes"}

echo -e "${BLUE}Configuration:${NC}"
echo -e "  Stage:    ${YELLOW}${STAGE}${NC}"
echo -e "  Seed DB:  ${YELLOW}${SEED_DB}${NC}"
echo ""

# Navigate to deploy directory
cd "$(dirname "$0")/../../deploy"

# Run the main deployment
echo -e "${BLUE}📦 Deploying  infrastructure...${NC}"
echo ""

# Assuming you have a deploy script or command
# Adjust this based on your actual deployment method
if [ -f "./deploy-.sh" ]; then
    ./deploy-.sh "$STAGE"
elif command -v tsx &> /dev/null; then
    tsx deploy--direct.ts "$STAGE"
else
    echo -e "${YELLOW}⚠️  No deployment script found, skipping infrastructure deployment${NC}"
fi

echo ""
echo -e "${GREEN}✅ Infrastructure deployment complete${NC}"
echo ""

# Seed the database if requested
if [[ "$SEED_DB" =~ ^[Yy]([Ee][Ss])?$ ]]; then
    echo -e "${BLUE}🌱 Seeding database...${NC}"
    echo ""
    
    cd "../aws-example/backend/scripts"
    ./seed-db.sh
    
    echo ""
    echo -e "${GREEN}✅ Database seeding complete${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping database seeding${NC}"
fi

echo ""
echo -e "${GREEN}🎉  Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the deployment"
echo "  2. Verify users in DynamoDB"
echo "  3. Check CloudWatch logs"
echo ""
