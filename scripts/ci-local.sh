#!/bin/bash

# Local CI script using Dagger
# Usage: ./scripts/ci-local.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Dagger is installed
if ! command -v dagger &> /dev/null; then
    echo -e "${RED}❌ Dagger CLI not found. Installing...${NC}"
    curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.18.14 sh
    sudo mv bin/dagger /usr/local/bin
fi

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Setup Dagger module if needed
if [ ! -d "ci/node_modules" ]; then
    echo -e "${YELLOW}📦 Setting up Dagger module...${NC}"
    cd ci
    npm install
    npm run build
    cd ..
fi

# Default command is pipeline
COMMAND=${1:-pipeline}

case $COMMAND in
    "lint")
        WORKSPACE=${2:-webapp}
        echo -e "${YELLOW}🔍 Running lint for $WORKSPACE...${NC}"
        dagger call lint --source=. --workspace=$WORKSPACE
        ;;
    "test")
        WORKSPACE=${2:-webapp}
        echo -e "${YELLOW}🧪 Running tests for $WORKSPACE...${NC}"
        dagger call test --source=. --workspace=$WORKSPACE
        ;;
    "build")
        echo -e "${YELLOW}🏗️  Building all packages...${NC}"
        dagger call build-packages --source=.
        ;;
    "typecheck")
        echo -e "${YELLOW}🔎 Running type check...${NC}"
        dagger call type-check --source=.
        ;;
    "pipeline")
        echo -e "${YELLOW}🚀 Running complete CI pipeline...${NC}"
        dagger call pipeline --source=.
        ;;
    "help")
        echo "Available commands:"
        echo "  lint [workspace]     - Run linting (default: webapp)"
        echo "  test [workspace]     - Run tests (default: webapp)"
        echo "  build               - Build all packages"
        echo "  typecheck           - Run type checking"
        echo "  pipeline            - Run complete CI pipeline (default)"
        echo "  help                - Show this help"
        echo ""
        echo "Available workspaces: webapp, auth, domain, storage"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo "Run './scripts/ci-local.sh help' for available commands"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Command '$COMMAND' completed successfully!${NC}"