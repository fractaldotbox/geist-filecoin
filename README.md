# Geist Filecoin

A modern content management system built with React and LiveStore for local-first data management.

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
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with LiveStore devtools
5. Submit a pull request

# Note on Techstack
- Original motivation is to use Astro for both CMS and the published website. 
  - It's on hold as  
   - as local-first, client sync heavy app, merit of Astro island architecture is limited, unless flow of seeding data is made easy & performant from astro to client. [Related](https://github.com/livestorejs/livestore/issues/364)
   - Livestore/ Solid integration is not mature yet. Embeding React inside astro isn't feasiable as integratinos require a a global Provider
   

## License

MIT License - see LICENSE file for details.