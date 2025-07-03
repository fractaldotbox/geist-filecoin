# Geist Filecoin

A modern content management system built with React and LiveStore for local-first data management.

## Features

- **Local-First Data**: LiveStore provides offline-first data storage with SQLite
- **Real-Time Sync**: Automatic synchronization across devices using Cloudflare Workers
- **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- **File Retrieval API**: RESTful API for secure file access with multiple storage providers
- **AES-256 Encryption**: Industry-standard encryption for file security
- **Storage Abstraction**: Support for Storacha, IPFS, Lighthouse, and S3
- **Type Safety**: Full TypeScript support throughout the application

## LiveStore Integration

This project uses [LiveStore](https://docs.livestore.dev/) for local-first data management. LiveStore provides:

- **Offline-first storage** using SQLite in the browser
- **Real-time synchronization** across devices
- **Event sourcing** for data changes
- **React integration** with hooks and providers

## Project Structure

```
packages/
├── web/                    # Frontend React application
│   ├── src/
│   │   ├── livestore/     # LiveStore configuration
│   │   ├── components/    # React components
│   │   └── ...
├── retrieval/             # File retrieval API service
│   ├── app/api/          # Next.js API routes
│   │   └── route.ts      # File and space endpoints
│   └── types/            # TypeScript definitions
├── storage/               # Storage abstraction layer
│   └── src/
│       └── storacha.ts   # Storacha/IPFS integration
├── encryption/            # AES-256 encryption utilities
│   ├── src/
│   │   └── encryption.ts # Encryption/decryption functions
│   ├── scripts/          # Utility scripts
│   └── test/             # Test suite
└── cf-worker/            # Cloudflare Worker for sync
    └── src/
        └── index.ts      # Sync handler
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
   
# Cloudflare Worker setup

- Refers to Docs for Local setup and provision values accordingly using `wrangler`
 - DB
 - KV
 - [Secret Store](https://developers.cloudflare.com/secrets-store/integrations/workers/)

## License

MIT License - see LICENSE file for details.
