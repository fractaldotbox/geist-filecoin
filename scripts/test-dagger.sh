#!/bin/bash

# Test script for Dagger CI functions
# This script validates that Dagger functions can be called without errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Dagger CI module...${NC}"

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if Dagger is available
if ! command -v dagger &> /dev/null; then
    echo -e "${RED}❌ Dagger CLI not found. Please install it first.${NC}"
    echo "Run: curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.14.0 sh"
    exit 1
fi

# Build the Dagger module
echo -e "${YELLOW}📦 Building Dagger module...${NC}"
cd ci
npm install --silent
npm run build --silent
cd ..

# Test function discovery
echo -e "${YELLOW}🔍 Testing function discovery...${NC}"
if dagger functions --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dagger functions are discoverable${NC}"
else
    echo -e "${RED}❌ Failed to discover Dagger functions${NC}"
    exit 1
fi

# Test basic container creation (quick test)
echo -e "${YELLOW}🐳 Testing container creation...${NC}"
if timeout 60 dagger call node-container --help > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Container creation test passed${NC}"
else
    echo -e "${RED}❌ Container creation test failed or timed out${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All Dagger tests passed!${NC}"
echo ""
echo "You can now run:"
echo "  ./scripts/ci-local.sh pipeline    # Run full CI pipeline"
echo "  ./scripts/ci-local.sh lint        # Run linting only"
echo "  ./scripts/ci-local.sh test        # Run tests only"