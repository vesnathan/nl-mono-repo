#!/bin/bash

# Colors for better UI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect if we're in Codespaces and set up options
if [[ -n "$CODESPACES" ]]; then
    OPTIONS=(
        "Deploy/Update Infrastructure (AWS CloudFormation)"
        "Run Development Server (Codespaces - recommended)"
        "Run Development Server (Local)"
        "Build GraphQL Types"
        "Exit"
    )
else
    OPTIONS=(
        "Deploy/Update Infrastructure (AWS CloudFormation)"
        "Run Development Server (Local - recommended)"
        "Run Development Server (Codespaces)"
        "Build GraphQL Types"
        "Exit"
    )
fi

# Function to display menu
show_menu() {
    clear
    echo -e "${CYAN}🚀 CloudWatch Live Development Helper${NC}"
    echo -e "${CYAN}=====================================${NC}"
    
    # Detect if we're in Codespaces
    if [[ -n "$CODESPACES" ]]; then
        echo -e "${YELLOW}📍 GitHub Codespaces detected${NC}"
    else
        echo -e "${YELLOW}📍 Local development environment detected${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}What would you like to do?${NC}"
    echo "Use ↑/↓ arrows to navigate, Enter to select:"
    echo ""
    
    for i in "${!OPTIONS[@]}"; do
        if [ $i -eq $1 ]; then
            echo -e "${PURPLE}► ${OPTIONS[i]}${NC}"
        else
            echo -e "  ${OPTIONS[i]}"
        fi
    done
}

# Initialize selection
selected=0
num_options=${#OPTIONS[@]}

# Show initial menu
show_menu $selected

# Read user input
while true; do
    read -rsn3 key
    case $key in
        $'\x1b[A') # Up arrow
            ((selected--))
            if [ $selected -lt 0 ]; then
                selected=$((num_options - 1))
            fi
            show_menu $selected
            ;;
        $'\x1b[B') # Down arrow
            ((selected++))
            if [ $selected -ge $num_options ]; then
                selected=0
            fi
            show_menu $selected
            ;;
        '') # Enter key
            break
            ;;
    esac
done

echo ""
echo -e "${GREEN}Selected: ${OPTIONS[selected]}${NC}"
echo ""

# Execute based on selection
case $selected in
    0) # Deploy/Update Infrastructure
        echo -e "${BLUE}🏗️  Starting infrastructure deployment...${NC}"
        echo ""
        yarn workspace @cwl/deploy development
        deployment_exit_code=$?
        echo ""
        if [ $deployment_exit_code -eq 0 ]; then
            echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
        else
            echo -e "${RED}❌ Deployment failed with exit code: $deployment_exit_code${NC}"
            echo -e "${YELLOW}📋 Please review the error messages above${NC}"
        fi
        echo ""
        echo -e "${CYAN}Press any key to return to the development menu, or Ctrl+C to exit...${NC}"
        read -n 1 -s
        exec "$0"  # Relaunch the dev menu
        ;;
    1) # Development Server (environment-specific)
        if [[ -n "$CODESPACES" ]]; then
            echo -e "${BLUE}☁️  Starting Codespaces development server...${NC}"
            echo -e "${YELLOW}📍 Frontend will be available at the forwarded port${NC}"
            echo -e "${CYAN}🔗 Check the 'Ports' tab in VS Code for the URL${NC}"
            echo ""
            yarn dev:codespaces
        else
            echo -e "${BLUE}🔥 Starting local development server...${NC}"
            echo -e "${YELLOW}📍 Frontend will be available at: http://localhost:3000${NC}"
            echo ""
            yarn dev:local
        fi
        ;;
    2) # Development Server (alternative)
        if [[ -n "$CODESPACES" ]]; then
            echo -e "${BLUE}🔥 Starting local development server...${NC}"
            echo -e "${YELLOW}📍 Frontend will be available at: http://localhost:3000${NC}"
            echo ""
            yarn dev:local
        else
            echo -e "${BLUE}☁️  Starting Codespaces development server...${NC}"
            echo -e "${YELLOW}📍 Frontend will be available at the forwarded port${NC}"
            echo ""
            yarn dev:codespaces
        fi
        ;;
    3) # Build GraphQL Types
        echo -e "${BLUE}🔧 Building GraphQL types...${NC}"
        echo ""
        yarn build-gql
        ;;
    4) # Exit
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
esac
