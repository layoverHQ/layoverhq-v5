#!/bin/bash

# LayoverHQ Branch Protection Setup Script
# Configures branch protection rules for secure development workflow

echo "🛡️  Branch Protection Setup for LayoverHQ"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository info
REPO_OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)

echo -e "${BLUE}Repository: $REPO_OWNER/$REPO_NAME${NC}"
echo ""

# Function to setup branch protection
setup_protection() {
    local branch=$1
    echo -e "${YELLOW}Setting up protection for branch: $branch${NC}"
    
    # Create the protection rules
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        /repos/$REPO_OWNER/$REPO_NAME/branches/$branch/protection \
        --field required_status_checks='{"strict":true,"contexts":["quality-checks","security-scan"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{
            "dismissal_restrictions":{},
            "dismiss_stale_reviews":true,
            "require_code_owner_reviews":false,
            "required_approving_review_count":1,
            "require_last_push_approval":false
        }' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field required_conversation_resolution=true \
        --field lock_branch=false \
        --field allow_fork_syncing=true \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Protection enabled for $branch${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Could not enable protection for $branch (requires admin access)${NC}"
        return 1
    fi
}

# Main protection setup
echo -e "${BLUE}🔧 Configuring branch protection rules...${NC}"
echo ""

# Setup main branch
setup_protection "main"

# Ask about develop branch
echo ""
read -p "Do you have a 'develop' branch to protect? (y/n): " HAS_DEVELOP
if [ "$HAS_DEVELOP" = "y" ]; then
    setup_protection "develop"
fi

# Create CODEOWNERS file
echo ""
echo -e "${BLUE}📝 Setting up CODEOWNERS...${NC}"

if [ ! -f ".github/CODEOWNERS" ]; then
    mkdir -p .github
    cat > .github/CODEOWNERS << 'EOF'
# LayoverHQ Code Owners
# These owners will be requested for review when someone opens a pull request

# Global owners (review all changes)
* @layoverHQ

# Frontend components
/components/ @layoverHQ
/app/ @layoverHQ

# Backend services
/lib/services/ @layoverHQ
/app/api/ @layoverHQ

# Database and migrations
/scripts/*.sql @layoverHQ
/lib/database/ @layoverHQ

# Configuration files
/.github/ @layoverHQ
*.config.* @layoverHQ
*.json @layoverHQ

# Documentation
/docs/ @layoverHQ
*.md @layoverHQ
EOF
    echo -e "${GREEN}✅ Created CODEOWNERS file${NC}"
else
    echo -e "${YELLOW}CODEOWNERS file already exists${NC}"
fi

# Create auto-merge configuration
echo ""
echo -e "${BLUE}🤖 Setting up auto-merge for Dependabot...${NC}"

# Enable auto-merge for Dependabot PRs
cat > .github/auto-merge.yml << 'EOF'
# Configuration for auto-merge bot
# Automatically merge Dependabot PRs that pass all checks

rules:
  - match:
      dependency_type: "development"
      update_type: "semver:patch"
    actions:
      merge:
        method: squash
        
  - match:
      dependency_type: "production"
      update_type: "security:patch"
    actions:
      merge:
        method: squash
        
  - match:
      dependency_type: "production"
      update_type: "semver:patch"
    actions:
      review:
        type: APPROVE
EOF

echo -e "${GREEN}✅ Created auto-merge configuration${NC}"

# Setup commit status checks
echo ""
echo -e "${BLUE}📊 Configuring status checks...${NC}"

# Get current protection settings and update
gh api \
    --method PATCH \
    -H "Accept: application/vnd.github+json" \
    /repos/$REPO_OWNER/$REPO_NAME/branches/main/protection/required_status_checks \
    --field strict=true \
    --field contexts='["quality-checks","security-scan","build","deploy-preview"]' \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Status checks configured${NC}"
else
    echo -e "${YELLOW}⚠️  Could not configure status checks${NC}"
fi

# Create merge queue configuration
echo ""
echo -e "${BLUE}🚦 Setting up merge queue...${NC}"

gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    /repos/$REPO_OWNER/$REPO_NAME/branches/main/protection/merge_queue \
    --field enabled=true \
    --field merge_method="squash" \
    --field min_reviews_count=1 \
    --field wait_timer=5 \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Merge queue enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Merge queue not available (requires GitHub Pro/Enterprise)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}✨ Branch Protection Setup Complete!${NC}"
echo ""
echo "Protection rules configured:"
echo "✅ Required status checks (quality & security)"
echo "✅ PR reviews required (1 approval)"
echo "✅ Dismiss stale reviews on new commits"
echo "✅ Require conversation resolution"
echo "✅ Prevent force pushes and deletions"
echo "✅ CODEOWNERS file created"
echo "✅ Auto-merge rules for dependencies"
echo ""
echo -e "${BLUE}Additional recommendations:${NC}"
echo "1. Add team members as collaborators"
echo "2. Configure webhook notifications"
echo "3. Set up deployment environments"
echo "4. Enable security alerts"
echo ""
echo "View settings: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"