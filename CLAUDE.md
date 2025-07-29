# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server (uses Turbo for monorepo orchestration)
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Run linting across all packages

### WebApp Specific (in apps/webapp/)
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm test` - Run Vitest tests
- `pnpm test:ui` - Run tests with UI
- `pnpm analyze` - Analyze bundle size
- `pnpm cf-typegen` - Generate Cloudflare Worker types

### Testing
- Tests use Vitest framework
- Test files are located in `src/test/`
- Use `pnpm test` to run all tests or `pnpm test:ui` for interactive testing

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with TypeScript, Vite, Tailwind CSS
- **Local-First Data**: LiveStore with SQLite for offline-first storage
- **Authentication**: Bluesky OAuth + Storacha email auth
- **Storage**: Storacha (Filecoin) + Lighthouse SDK for decentralized storage
- **Deployment**: Cloudflare Workers for both CMS and sync
- **UI Components**: shadcn/ui with Radix UI primitives

### Key Architectural Patterns

#### LiveStore Integration
- `src/livestore/schema.ts` - Defines SQLite tables, events, and materializers
- Tables: entries, contentTypes, spaces, AccessPolicys, storageAuthorizations, uiState
- Events use event sourcing pattern with synced events for data changes
- Client documents (uiState) for local-only state management

#### Data Flow
1. **Events** → describe data changes (entryCreated, spaceUpdated, etc.)
2. **Materializers** → map events to SQLite state changes
3. **Queries** → read data from local SQLite store
4. **Sync** → real-time synchronization via Cloudflare Workers

#### Authentication Architecture
- Multiple auth providers: Bluesky OAuth + Storacha email
- Auth state managed in LiveStore uiState table
- DID-based identity system
- Token refresh for Bluesky sessions

#### Storage Architecture
- Multi-provider support: Storacha (primary) + Lighthouse
- Space-based organization with storage authorizations
- Content types define structured data schemas
- File uploads handled via storage provider APIs

### Key Directories
- `src/components/react/` - React components including auth, editors, UI
- `src/livestore/` - LiveStore configuration (schema, queries, worker)
- `src/pages/` - Route components
- `src/services/` - External service integrations
- `worker/` - Cloudflare Worker for sync and API endpoints

### Important Files
- `src/livestore/schema.ts` - Core data model and event definitions
- `src/components/react/AuthProvider.tsx` - Authentication context and logic
- `src/components/react/StorachaProvider.tsx` - Storage provider initialization
- `worker/index.ts` - Cloudflare Worker entry point

## Development Notes

### Monorepo Structure
- Uses pnpm workspaces with Turbo for build orchestration
- Main webapp in `apps/webapp/`
- Shared packages in `packages/` (auth, domain, storage)

### LiveStore Development
- Local SQLite database runs in browser via WebAssembly
- Real-time sync requires Cloudflare Worker deployment
- Use LiveStore devtools for debugging queries and state

### Cloudflare Setup
- Requires DB, KV, and Secret Store provisioning via wrangler
- Worker handles OAuth callbacks and sync endpoints
- Deploy with `pnpm deploy` after building

### Content Management
- Spaces organize content with access policies
- Content types define field schemas (JSON-based)
- Entries are content instances linked to types and spaces