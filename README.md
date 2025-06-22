# Geist Filecoin

A modern content management system built with Astro, React, and LiveStore for local-first data management.

## Features

- **Local-First Data**: LiveStore provides offline-first data storage with SQLite
- **Real-Time Sync**: Automatic synchronization across devices using Cloudflare Workers
- **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- **Filecoin Integration**: Lighthouse SDK for decentralized file storage
- **Type Safety**: Full TypeScript support throughout the application

## LiveStore Integration

This project uses [LiveStore](https://docs.livestore.dev/) for local-first data management. LiveStore provides:

- **Offline-first storage** using SQLite in the browser
- **Real-time synchronization** across devices
- **Event sourcing** for data changes
- **React integration** with hooks and providers

### LiveStore Setup

The LiveStore integration includes:

1. **Schema Definition** (`src/livestore/schema.ts`)
   - Defines data models for entries, schemas, and UI state
   - Includes events for CRUD operations
   - Materializers map events to database changes

2. **Worker Configuration** (`src/livestore/livestore.worker.ts`)
   - Handles background processing and synchronization
   - Configured for Cloudflare Workers sync

3. **React Integration**
   - `LiveStoreProvider` wraps the application
   - `useLiveStore` hook provides easy access to LiveStore operations
   - Predefined queries for common operations

4. **Cloudflare Worker** (`src/worker/index.ts`)
   - Handles synchronization between clients
   - Basic authentication (configure for production)

### Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.sample .env
   # Edit .env with your configuration
   ```

3. **Start development servers**:
   ```bash
   # Terminal 1: Start the main application
   pnpm dev
   
   # Terminal 2: Start the Cloudflare Worker (optional for local development)
   pnpm dev:worker
   ```

4. **Access the application**:
   - Main app: http://localhost:60001
   - LiveStore devtools: http://localhost:60001/_livestore

### Using LiveStore in Components

```tsx
import { useLiveStore } from '@/components/react/hooks/useLiveStore'
import { useStore } from '@livestore/react'
import { allEntries$ } from '@/livestore/queries'

function MyComponent() {
  const { createEntry, updateEntry, deleteEntry } = useLiveStore()
  const { store } = useStore()
  
  // Query data
  const entries = store.useQuery(allEntries$)
  
  // Create entry
  const handleCreate = () => {
    createEntry({
      schemaId: 'blog',
      title: 'My Post',
      content: 'Content here...',
    })
  }
  
  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id}>{entry.title}</div>
      ))}
    </div>
  )
}
```

### Data Model

The LiveStore schema includes:

- **Entries**: Content entries with title, content, media, and metadata
- **Schemas**: Content type definitions with properties and validation
- **UI State**: Local UI state for forms and user preferences

### Development

- **LiveStore DevTools**: Available at `http://localhost:60001/_livestore` during development
- **Worker Development**: Use `pnpm dev:worker` to run the sync worker locally
- **Schema Changes**: Update `src/livestore/schema.ts` and restart the development server

### Production Deployment

1. **Deploy Cloudflare Worker**:
   ```bash
   pnpm wrangler deploy
   ```

2. **Update environment variables** with production sync URL

3. **Build and deploy the application**:
   ```bash
   pnpm build
   ```

## Project Structure

```
packages/web/
├── src/
│   ├── livestore/           # LiveStore configuration
│   │   ├── schema.ts       # Data model and events
│   │   ├── queries.ts      # Database queries
│   │   └── livestore.worker.ts # Background worker
│   ├── worker/             # Cloudflare Worker
│   │   └── index.ts        # Sync handler
│   └── components/react/   # React components
│       ├── LiveStoreProvider.tsx
│       ├── hooks/useLiveStore.ts
│       └── LiveStoreEntryEditor.tsx
├── wrangler.toml           # Cloudflare Worker config
└── astro.config.mjs        # Astro configuration with LiveStore
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with LiveStore devtools
5. Submit a pull request

# Note on Techstack
- Original motivation is to use Astro, however as a local-first, client sync heavy app merit of Astro is limited 
- Currently to integrate Livestore in React, a global Provider is required
- Future we could keep Astro island architecture and integrate solid once the integraiton reaches maturirty. 



## License

MIT License - see LICENSE file for details.