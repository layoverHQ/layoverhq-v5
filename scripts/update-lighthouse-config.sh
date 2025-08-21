#!/bin/bash

# Script to update Lighthouse configuration with Vercel domain

echo "🔍 Lighthouse Configuration Updater"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .lighthouserc.json exists
if [ ! -f ".lighthouserc.json" ]; then
    echo "Creating .lighthouserc.json..."
    cat > .lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["https://layoverhq.vercel.app"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.8}],
        "categories:seo": ["warn", {"minScore": 0.8}],
        "first-contentful-paint": ["warn", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["warn", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["warn", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["warn", {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
EOF
    echo -e "${GREEN}✅ Created .lighthouserc.json${NC}"
fi

echo -e "${BLUE}Please provide your Vercel domain information:${NC}"
echo ""
echo "Common formats:"
echo "  • layoverhq.vercel.app (default Vercel domain)"
echo "  • layoverhq-[team].vercel.app (team deployment)"
echo "  • layoverhq.com (custom domain)"
echo ""

read -p "Enter your Vercel domain (or press Enter for default): " VERCEL_DOMAIN

# Use default if not provided
if [ -z "$VERCEL_DOMAIN" ]; then
    VERCEL_DOMAIN="layoverhq.vercel.app"
    echo -e "${YELLOW}Using default domain: $VERCEL_DOMAIN${NC}"
fi

# Ensure https:// prefix
if [[ ! "$VERCEL_DOMAIN" == https://* ]]; then
    VERCEL_DOMAIN="https://$VERCEL_DOMAIN"
fi

# Update the Lighthouse config
echo "Updating Lighthouse configuration..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|\"url\": \[\"[^\"]*\"\]|\"url\": \[\"$VERCEL_DOMAIN\"\]|g" .lighthouserc.json
else
    # Linux
    sed -i "s|\"url\": \[\"[^\"]*\"\]|\"url\": \[\"$VERCEL_DOMAIN\"\]|g" .lighthouserc.json
fi

echo -e "${GREEN}✅ Updated Lighthouse config with: $VERCEL_DOMAIN${NC}"

# Ask about additional URLs
echo ""
read -p "Do you want to add additional URLs to test? (y/n): " ADD_MORE

if [ "$ADD_MORE" = "y" ]; then
    echo "Enter additional URLs (one per line, press Ctrl+D when done):"
    URLS="\"$VERCEL_DOMAIN\""
    while IFS= read -r url; do
        if [ -n "$url" ]; then
            if [[ ! "$url" == https://* ]]; then
                url="https://$url"
            fi
            URLS="$URLS, \"$url\""
        fi
    done
    
    # Update with multiple URLs
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|\"url\": \[\"[^\"]*\"\]|\"url\": \[$URLS\]|g" .lighthouserc.json
    else
        sed -i "s|\"url\": \[\"[^\"]*\"\]|\"url\": \[$URLS\]|g" .lighthouserc.json
    fi
    
    echo -e "${GREEN}✅ Added multiple URLs for testing${NC}"
fi

# Display the updated config
echo ""
echo -e "${BLUE}Updated Lighthouse Configuration:${NC}"
echo "--------------------------------"
cat .lighthouserc.json
echo ""
echo "--------------------------------"

# Offer to test the configuration
echo ""
read -p "Do you want to test the Lighthouse configuration now? (y/n): " TEST_NOW

if [ "$TEST_NOW" = "y" ]; then
    echo "Installing Lighthouse CI..."
    npm install -g @lhci/cli@0.12.x
    
    echo "Running Lighthouse test..."
    lhci autorun || echo -e "${YELLOW}⚠️  Lighthouse test failed - this is normal if the site isn't deployed yet${NC}"
fi

echo ""
echo -e "${GREEN}✨ Lighthouse configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit the updated .lighthouserc.json"
echo "2. Push to trigger the CI/CD pipeline"
echo "3. Monitor performance scores in GitHub Actions"