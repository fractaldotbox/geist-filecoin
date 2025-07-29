# Dagger CI Module for Geist Filecoin

This directory contains the Dagger CI module that powers the continuous integration and deployment pipelines for the Geist Filecoin project.

## Overview

The CI pipeline has been refactored to use [Dagger](https://dagger.io/) to provide:

- **Reproducible builds**: Same results locally and in CI
- **Fast caching**: Intelligent dependency and build caching
- **Language agnostic**: Can integrate with any language/framework
- **Local development**: Run the exact same CI pipeline locally
- **Simplified GitHub Actions**: Actions just orchestrate Dagger calls

## Architecture

```
.github/workflows/
├── ci.yml           # Runs Dagger CI pipeline  
├── deploy.yml       # Runs Dagger deployment pipeline
└── ...

ci/                  # Dagger module
├── src/index.ts     # Main Dagger functions
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## Available Functions

### Development Functions

- `lint(source, workspace)` - Run linting for specific workspace
- `test(source, workspace)` - Run tests for specific workspace  
- `buildPackages(source)` - Build all packages
- `buildWebapp(source)` - Build webapp
- `typeCheck(source)` - Run TypeScript type checking
- `pipeline(source)` - Run complete CI pipeline

### Deployment Functions

- `deploy(source, environment, ...)` - Deploy webapp to Cloudflare Workers
- `deployLivestoreSync(source, ...)` - Deploy LiveStore sync worker
- `healthCheck(baseUrl)` - Run deployment health checks

## Local Usage

### Prerequisites

1. Install Dagger CLI:
   ```bash
   curl -L https://dl.dagger.io/dagger/install.sh | DAGGER_VERSION=0.14.0 sh
   sudo mv bin/dagger /usr/local/bin
   ```

2. Install dependencies:
   ```bash
   cd ci
   npm install
   npm run build
   ```

### Running CI Pipeline

From the project root:

```bash
# Run complete CI pipeline
dagger call pipeline --source=.

# Run individual steps
dagger call lint --source=. --workspace=webapp
dagger call test --source=. --workspace=webapp  
dagger call build-webapp --source=.
dagger call type-check --source=.
```

### Running Deployment

```bash
# Deploy to staging
dagger call deploy \
  --source=. \
  --environment=staging \
  --cloudflare-api-token=$CLOUDFLARE_API_TOKEN \
  --cloudflare-account-id=$CLOUDFLARE_ACCOUNT_ID \
  --vite-host=$VITE_HOST \
  --vite-livestore-sync-url=$VITE_LIVESTORE_SYNC_URL \
  --vite-livestore-store-id=$VITE_LIVESTORE_STORE_ID \
  --lighthouse-api-key=$LIGHTHOUSE_API_KEY \
  --geist-jwt-secret=$GEIST_JWT_SECRET

# Deploy LiveStore sync worker
dagger call deploy-livestore-sync \
  --source=. \
  --cloudflare-api-token=$CLOUDFLARE_API_TOKEN \
  --cloudflare-account-id=$CLOUDFLARE_ACCOUNT_ID

# Run health checks
dagger call health-check --base-url=https://filecoin.geist.network
```

## Benefits of Dagger Migration

### Before (GitHub Actions only)
- 300+ lines of YAML across workflows
- Complex matrix strategies and job dependencies
- Difficult to reproduce locally
- No caching between workflow runs
- Verbose error handling and reporting

### After (Dagger + GitHub Actions)
- ~80 lines of YAML in workflows
- Simple Dagger function calls
- Same pipeline runs locally and in CI
- Intelligent caching across all steps
- Centralized error handling in TypeScript

### Performance Improvements
- **Parallel execution**: All linting, testing, and building happens in parallel
- **Smart caching**: Dagger caches at every step, not just GitHub Actions cache
- **Faster failures**: Pipeline fails fast on first error instead of waiting for all matrix jobs

### Developer Experience
- **Local testing**: Run `dagger call pipeline --source=.` to test changes locally
- **Debugging**: Full TypeScript debugging support for CI logic
- **Consistency**: Same containers and dependencies locally and in CI

## Maintenance

### Adding New Workspaces
To add a new workspace to the CI pipeline:

1. Update the `lint()`, `test()`, or `build()` functions in `src/index.ts`
2. Add the workspace to the command mappings
3. No changes needed in GitHub Actions workflows

### Updating Dependencies
- Update `ci/package.json` for Dagger module dependencies
- Update `nodeVersion` and `pnpmVersion` in `src/index.ts` for runtime versions

### Extending Pipeline
Add new functions to `src/index.ts` and call them from GitHub Actions workflows or locally.