# Retrieval API

This package provides versioned API endpoints for file retrieval and space management with support for multiple storage providers and file decryption using the `@geist-filecoin/encryption` package.

## API Version: v1

All endpoints are versioned and available under `/api/v1/`. Legacy endpoints without version are redirected to v1.

## API Endpoints

### GET `/api/v1/health`

Health check endpoint that provides system status and service availability.

**Example:**
```
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "2025-06-29T10:00:00.000Z",
  "uptime": 12345.67,
  "environment": {
    "node": "v22.14.0",
    "platform": "darwin",
    "arch": "arm64"
  },
  "services": {
    "storacha": {
      "configured": true,
      "status": "ready"
    },
    "encryption": {
      "configured": true,
      "status": "ready"
    }
  }
}
```

### GET `/api/v1`

API information endpoint that provides details about available endpoints and supported features.

**Example:**
```
GET /api/v1
```

**Response:**
```json
{
  "name": "Geist Filecoin Retrieval API",
  "version": "v1",
  "description": "API for retrieving files from decentralized storage providers",
  "endpoints": {
    "health": "/api/v1/health",
    "files": "/api/v1/files/{cid}",
    "spaces": "/api/v1/spaces/{did}"
  },
  "supportedProviders": ["storacha", "s3", "lighthouse", "ipfs"],
  "documentation": "https://github.com/geist-filecoin/retrieval"
}
```

### GET `/api/v1/files/:cid`

Retrieves a file by its Content Identifier (CID) from various storage providers.

**Parameters:**
- `cid` (path parameter): The Content Identifier of the file to retrieve
- `provider` (query parameter, optional): Storage provider to use (`storacha`, `ipfs`, `lighthouse`, `s3`)
  - Default: `storacha`

**Example:**
```
GET /api/v1/files/QmYourFileHash?provider=storacha
```

**Response:**
- Returns the decrypted file content with appropriate content-type headers
- Files are automatically decrypted using the `@geist-filecoin/encryption` package
- Uses safe decryption with graceful fallback for non-encrypted files
- Includes `X-Decrypted` header indicating if the file was encrypted
- Includes `X-API-Version: v1` header

### GET `/api/v1/spaces/:did`

Retrieves all files from a specific storage space.

**Parameters:**
- `did` (path parameter): The Decentralized Identifier (DID) of the space

**Example:**
```
GET /api/v1/spaces/did:key:z6MkYourSpaceDID
```

**Response:**
```json
{
  "spaceDid": "did:key:z6MkYourSpaceDID",
  "files": [
    {
      "cid": "QmYourFileHash",
      "name": "filename.txt",
      "size": 1024,
      "created": "2025-06-29T10:00:00.000Z",
      "shards": ["QmShard1", "QmShard2"]
    }
  ],
  "total": 1
}
```

## Legacy Support

The API maintains full backward compatibility with non-versioned endpoints through **301 redirects**:

- `GET /api` → **301 Redirect** to `/api/v1`
- `GET /api/health` → **301 Redirect** to `/api/v1/health`
- `GET /api/files/{cid}` → **301 Redirect** to `/api/v1/files/{cid}`
- `GET /api/spaces/{did}` → **301 Redirect** to `/api/v1/spaces/{did}`

This ensures existing clients continue to work seamlessly while encouraging migration to versioned endpoints. The redirects preserve all query parameters and request headers.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# AES-256 encryption key for file decryption (use a strong, random key in production)
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-secure-256-bit-encryption-key-here-change-this-in-production

# Storacha configuration
VITE_STORACHA_KEY=your-storacha-key
VITE_STORACHA_PROOF=your-storacha-proof

# Lighthouse configuration (optional)
LIGHTHOUSE_API_KEY=your-lighthouse-api-key
```

**Important**: Generate a secure encryption key using the encryption package:

```bash
# From the encryption package directory
cd packages/encryption
npm run generate-key

# Or using the workspace commands
npm run generate-key --workspace=@geist-filecoin/encryption
```

## Storage Providers

### Storacha/IPFS
- Uses IPFS gateway for file retrieval
- Requires Storacha configuration for space listing
- Default provider

### Lighthouse
- Uses Lighthouse Storage gateway
- Requires `LIGHTHOUSE_API_KEY` environment variable

### S3
- Not yet implemented
- Placeholder for future AWS S3 integration

## Security Features

### File Encryption/Decryption

- **Uses `@geist-filecoin/encryption` package**: Industry-standard AES-256-GCM encryption
- **Safe Decryption**: Automatic detection and graceful fallback for non-encrypted files
- **Binary Data Support**: Handles both text and binary file formats
- **Authentication**: Built-in authentication prevents data tampering
- **Performance**: Efficient buffer-based processing for large files

For detailed encryption specifications, see the `@geist-filecoin/encryption` package documentation.

### Error Handling
- Proper HTTP status codes for different error scenarios
- Detailed error messages for debugging
- Graceful fallback when decryption fails

## Development

### Running the API
```bash
cd packages/retrieval
npm run dev
```

The API will be available at `http://localhost:4000/api/`

### Testing the Endpoints

Test file retrieval:

```bash
curl "http://localhost:4000/api/files/QmYourFileHash?provider=storacha"
```

Test space listing:

```bash
curl "http://localhost:4000/api/spaces/did:key:z6MkYourSpaceDID"
```

## Type Definitions

The API uses TypeScript interfaces defined in `types/api.ts`:

- `FileMetadata`: Represents file information in a space
- `SpaceFilesResponse`: Response format for space file listings
- `StorageProviderType`: Supported storage provider types
