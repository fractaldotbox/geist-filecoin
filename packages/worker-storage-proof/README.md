# Storage Proof Worker

A Cloudflare Worker for generating Filecoin storage proofs.

## Features

- Health check endpoint
- Storage proof generation endpoint
- TypeScript support
- Built with itty-router for clean routing

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Deploy to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

### Health Check
- `GET /health`
- Returns: `200 OK` if the service is running

### Generate Storage Proof
- `POST /generate-proof`
- Body:
  ```json
  {
    "pieceCID": "string",
    "dealID": "string"
  }
  ```
- Returns: Storage proof data

## Environment Variables

- `ENVIRONMENT`: The deployment environment (development/production)

## License

Private - All rights reserved 