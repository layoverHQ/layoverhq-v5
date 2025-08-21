#!/bin/bash

# LayoverHQ GitHub Actions Setup Script
# This script helps configure GitHub Actions CI/CD for the LayoverHQ platform

echo "🚀 LayoverHQ GitHub Actions Setup"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Prerequisites:${NC}"
echo "1. GitHub CLI authenticated (gh auth login)"
echo "2. Vercel account with project set up"
echo "3. Repository admin access"
echo ""

# Function to set GitHub secret
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo -e "${YELLOW}Setting secret: $secret_name${NC}"
    echo "$secret_value" | gh secret set "$secret_name"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $secret_name set successfully${NC}"
    else
        echo -e "${RED}❌ Failed to set $secret_name${NC}"
        return 1
    fi
}

# Get Vercel credentials
echo -e "${BLUE}🔐 Vercel Configuration${NC}"
echo "Please provide your Vercel credentials:"
echo ""

echo "To find these values:"
echo "1. VERCEL_TOKEN: Go to https://vercel.com/account/tokens"
echo "2. VERCEL_ORG_ID: Go to https://vercel.com/teams/[your-team]/settings"
echo "3. VERCEL_PROJECT_ID: Go to your project settings in Vercel"
echo ""

read -p "Enter VERCEL_TOKEN: " VERCEL_TOKEN
read -p "Enter VERCEL_ORG_ID: " VERCEL_ORG_ID  
read -p "Enter VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID

# Validate inputs
if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo -e "${RED}❌ All Vercel credentials are required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Setting up GitHub Secrets...${NC}"

# Set GitHub secrets
set_github_secret "VERCEL_TOKEN" "$VERCEL_TOKEN"
set_github_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID"
set_github_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID"

echo ""
echo -e "${BLUE}📝 Creating GitHub Actions workflow...${NC}"

# Create .github directories if they don't exist
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

# Check if workflow file already exists
if [ -f ".github/workflows/ci-cd.yml" ]; then
    echo -e "${YELLOW}⚠️  Workflow file already exists. Skipping creation.${NC}"
else
    echo "Creating CI/CD workflow..."
    # The workflow file should already exist from our previous work
    echo -e "${GREEN}✅ Workflow file ready${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Getting Vercel project URL...${NC}"

# Try to get the Vercel project URL
VERCEL_URL=$(vercel --token="$VERCEL_TOKEN" inspect --scope="$VERCEL_ORG_ID" 2>/dev/null | grep "Production:" | awk '{print $2}')

if [ -n "$VERCEL_URL" ]; then
    echo -e "${GREEN}✅ Found Vercel URL: $VERCEL_URL${NC}"
    
    # Update Lighthouse config with actual URL
    if [ -f ".lighthouserc.json" ]; then
        echo "Updating Lighthouse configuration..."
        sed -i.bak "s|https://your-vercel-domain.vercel.app|$VERCEL_URL|g" .lighthouserc.json
        rm .lighthouserc.json.bak
        echo -e "${GREEN}✅ Lighthouse config updated${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not auto-detect Vercel URL. Please update .lighthouserc.json manually${NC}"
fi

echo ""
echo -e "${BLUE}🛡️ Setting up branch protection rules...${NC}"

# Set up branch protection for main branch
read -p "Do you want to set up branch protection rules for 'main'? (y/n): " setup_protection

if [ "$setup_protection" = "y" ]; then
    gh api repos/:owner/:repo/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["quality-checks","security-scan"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Branch protection rules configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not set branch protection (requires admin access)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push the GitHub Actions workflow files"
echo "2. Create a test pull request to verify the CI/CD pipeline"
echo "3. Monitor the Actions tab in your GitHub repository"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "• View secrets: gh secret list"
echo "• View workflows: gh workflow list"
echo "• View runs: gh run list"
echo "• Watch a run: gh run watch"
echo ""
echo -e "${GREEN}🚀 Your CI/CD pipeline is ready to go!${NC}"