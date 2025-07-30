# Geist Filecoin

A modern, local-first content management system built with React 19, LiveStore, and decentralized storage. Geist Filecoin enables content creators to build, manage, and publish content with offline-first capabilities while leveraging Web3 storage solutions.

## Features

### Core Capabilities
- **Local-First Architecture**: Offline-first data management with SQLite in the browser
- **Real-Time Sync**: Automatic synchronization across devices using Cloudflare Workers
- **Multi-Provider Authentication**: Support for both Bluesky OAuth and Storacha email authentication
- **Decentralized Storage**: Multiple storage providers including Storacha (Filecoin) and Lighthouse SDK
- **Content Type System**: Flexible, schema-based content modeling with JSON Schema
- **Space-Based Organization**: Multi-tenant architecture with spaces, access policies, and storage authorizations
- **Modern UI**: Built with React 19, Vite, Tailwind CSS v4, and shadcn/ui components

### Advanced Features
- **Access Control**: Granular permissions system with policy-based access control
- **Storage Authorizations**: Delegated storage permissions with UCAN (User Controlled Authorization Networks)
- **Content Types**: Pre-built schemas for blogs, products, and landing pages with extensible field types
- **File Upload Support**: Direct file uploads to decentralized storage with progress tracking
- **Theme Support**: Dark/light mode with system preference detection
- **Type Safety**: Full TypeScript support throughout the application

## Technology Stack

### Frontend
- **React 19** with TypeScript for the user interface
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling with **shadcn/ui** component library
- **React Router v6** for client-side routing
- **React Hook Form** with Zod validation

### Data & Storage
- **LiveStore** for local-first data management with SQLite
- **Storacha** (Filecoin) as primary decentralized storage provider
- **Lighthouse SDK** as secondary storage provider
- **Event Sourcing** pattern for data changes and synchronization

### Authentication & Authorization
- **Bluesky OAuth** for social authentication
- **Storacha Email Auth** for web3 storage authentication  
- **DID-based Identity** system with token refresh
- **UCAN** (User Controlled Authorization Networks) for delegation

### Infrastructure
- **Cloudflare Workers** for sync, API endpoints, and deployment
- **pnpm Workspaces** with **Turbo** for monorepo management
- **Vitest** for testing with UI support
- **ESLint** and **Biome** for code quality

## Architecture Overview

### Monorepo Structure
```
geist-filecoin/
├── apps/
│   ├── webapp/                 # Main React application
│   └── demo-astro-blog/        # Demo Astro blog implementation
├── packages/
│   ├── auth/                   # Authentication & policy engine
│   ├── cf-worker/              # Cloudflare Worker packages
│   ├── domain/                 # Domain models & types
│   ├── storage/                # Storage provider abstractions
│   └── ci/                     # CI/CD utilities
├── scripts/                    # Build and deployment scripts
└── docs/                       # Documentation
```

### Main Application Structure
```
apps/webapp/
├── src/
│   ├── components/react/       # React components
│   │   ├── fields/            # Form field components
│   │   ├── hooks/             # Custom React hooks
│   │   └── ui/                # shadcn/ui components
│   ├── livestore/             # LiveStore configuration
│   │   ├── schema.ts          # SQLite tables & events
│   │   ├── queries.ts         # Database queries
│   │   └── livestore.worker.ts # Background worker
│   ├── pages/                 # Route components
│   ├── services/              # External service integrations
│   ├── content-type/          # Content type schemas
│   └── worker/                # Cloudflare Worker entry
├── worker/                    # Cloudflare Worker source
└── wrangler.jsonc            # Cloudflare Worker config
```

### Data Model

#### Core Tables
- **entries**: Content instances with metadata and storage references
- **contentTypes**: Schema definitions using JSON Schema
- **spaces**: Multi-tenant workspaces with storage configuration
- **AccessPolicys**: Permission rules and access control
- **storageAuthorizations**: UCAN-based storage delegations
- **uiState**: Client-side UI state (local only)

#### Event Sourcing
- Events describe all data changes (entryCreated, spaceUpdated, etc.)
- Materializers map events to SQLite state changes
- Real-time sync propagates events across devices
- Event history enables audit trails and rollbacks

## Quick Start

### Prerequisites
- **Node.js** >= 23.0.0
- **pnpm** >= 10.13.1
- **Cloudflare Account** (for deployment)
- **Storacha Account** (for decentralized storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/geist-filecoin.git
   cd geist-filecoin
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp env.sample .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

The webapp will be available at `http://localhost:5173`

### Development Commands

#### Core Commands
- `pnpm dev` - Start development server (uses Turbo for monorepo orchestration)
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Run linting across all packages

#### WebApp Specific (in apps/webapp/)
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm test` - Run Vitest tests
- `pnpm test:ui` - Run tests with UI
- `pnpm analyze` - Analyze bundle size
- `pnpm cf-typegen` - Generate Cloudflare Worker types

## Configuration

### Cloudflare Worker Setup

1. **Provision Cloudflare resources**
   ```bash
   # Create database
   wrangler d1 create geist-filecoin-db
   
   # Create KV namespace
   wrangler kv:namespace create "geist-filecoin-kv"
   
   # Create secrets store
   wrangler secret-store create geist-filecoin-secrets
   ```

2. **Deploy worker**
   ```bash
   cd apps/webapp
   pnpm deploy
   ```

### Storacha Setup

1. **Create account and login**
    - Follow storacha [documentation](https://docs.storacha.network/how-to/create-account/#using-the-cli) 
   ```bash
   storacha login your@email.com
   ```

2. **Create space and delegate to agent**

   
   Follow the Storacha documentation:
   - [Create Space Guide](https://docs.storacha.network/how-to/create-space/)
   - [UCAN Delegation Guide](https://docs.storacha.network/concepts/ucan/#step-by-step-delegation-with-w3cli)

3. **Configure secrets**
   ```bash
   # Storacha agent key
   wrangler secrets-store secret create $CF_SECRET_STORE_ID \
     --name STORACHA_AGENT_KEY_STRING \
     --value $STORACHA_AGENT_KEY_STRING \
     --scopes=workers
   ```

4. **Configure delegation proof via KV**
   ```bash
   wrangler kv key put --namespace-id $KV_NAMESPACE_ID \
     "delegation-proof" $DELEGATION_PROOF_VALUE
   ```

### Authentication Configuration

The application supports multiple authentication providers:

#### Bluesky OAuth
- Configure OAuth client credentials in Cloudflare secrets
- Supports handle resolution and session refresh
- DID-based identity with automatic token management

#### Storacha Email Auth
- Email-based authentication with magic links
- Integrates with Storacha storage permissions
- UCAN delegation for storage authorization

## Content Management

### Content Types
Pre-built content types include:
- **Blog**: Title, slug, hero image, content (markdown), meta description, author, publish date, tags
- **Product**: Name, description, price, images, categories
- **Landing Page**: Hero content, sections, call-to-actions

### Creating Custom Content Types
Content types use JSON Schema for validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "The title of the content"
    },
    "content": {
      "type": "string",
      "description": "Main content (markdown supported)"
    }
  },
  "required": ["title"]
}
```

### Field Types
- **Text**: Single-line text input
- **Textarea**: Multi-line text
- **Markdown**: Rich text with markdown support
- **Date**: Date picker with calendar
- **File**: File upload with storage provider integration
- **Array**: Repeatable field groups

## Development

### Local State Management
- LiveStore uses SQLite in the browser via WebAssembly
- Use `VITE_LIVESTORE_STORE_ID` environment variable to reset local state
- LiveStore devtools available for debugging queries and state

### Testing
- Tests use Vitest framework
- Test files located in `src/test/`
- Run tests: `pnpm test` or `pnpm test:ui` for interactive testing

### Storage Providers
The system supports multiple storage providers:

#### Storacha (Primary - Filecoin)
```typescript
enum StorageProvider {
  Storacha = "storacha",
  S3 = "s3"
}
```

- Web3 storage powered by IPFS and Filecoin
- UCAN-based authorization
- Decentralized and censorship-resistant

#### Lighthouse SDK (Secondary)
- Alternative decentralized storage
- IPFS-based with additional features
- Configurable per space

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow TypeScript and ESLint conventions
   - Add tests for new functionality
   - Update documentation as needed
4. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```
5. **Submit a pull request**

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React and TypeScript rules
- **Biome**: Additional formatting and linting
- **Vitest**: Unit and integration testing

## Deployment

### Production Deployment
1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Deploy to Cloudflare Workers**
   ```bash
   cd apps/webapp
   pnpm deploy
   ```

3. **Configure custom domain** (optional)
   - Set up custom domain in Cloudflare dashboard
   - Update worker routes as needed

### Environment Variables
- `VITE_LIVESTORE_STORE_ID`: LiveStore database identifier
- `VITE_CLOUDFLARE_WORKER_URL`: Cloudflare Worker sync endpoint
- `VITE_BLUESKY_CLIENT_ID`: Bluesky OAuth client ID
- `VITE_STORACHA_ENDPOINT`: Storacha API endpoint

## Future Roadmap

### Astro Integration
The project originally intended to use Astro for both CMS and published websites. This is currently on hold due to:
- Limited benefits of Astro's island architecture for local-first, sync-heavy applications
- Immature LiveStore/Solid integration
- Complexity of embedding React components requiring global providers

Future developments may revisit this approach as the ecosystem matures.

### Planned Features
- Enhanced access control with role-based permissions
- Multi-language content support
- Advanced content scheduling and publishing workflows
- Plugin system for custom field types
- GraphQL API for external integrations

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Project Wiki](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/geist-filecoin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/geist-filecoin/discussions)

