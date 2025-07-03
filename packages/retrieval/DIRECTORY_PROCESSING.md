# Updated CID Processing for Geist Filecoin Retrieval

This document explains the updated CID processing functionality that can handle files, directories, and raw data using Helia/UnixFS.

## New Features

### 1. Automatic CID Type Detection
The API now automatically detects whether a CID points to:
- **File**: Individual files with content
- **Directory**: Folder containing multiple files/subdirectories
- **Raw**: Raw binary data

### 2. Directory Listing

When accessing a directory CID, you can:

- Get JSON structure (default)
- Access specific files with `?path=filename.ext`

### 3. Enhanced File Processing
- Automatic content type detection
- Proper encryption/decryption handling
- Support for accessing files within directories

## API Usage Examples

### 1. Get Directory Structure (JSON)

```bash
# Get directory structure as JSON (default)
curl "http://localhost:4000/api/v1/files/QmDirectoryCID"

# Response:
{
  "success": true,
  "type": "directory",
  "cid": "QmDirectoryCID",
  "totalFiles": 5,
  "totalDirectories": 2,
  "totalSize": 1024000,
  "files": [
    {
      "name": "document.pdf",
      "path": "document.pdf",
      "cid": "QmFileCID1",
      "size": 512000,
      "type": "file"
    },
    {
      "name": "images",
      "path": "images",
      "cid": "QmSubDirCID",
      "size": 256000,
      "type": "directory"
    }
  ]
}
```

### 2. Get Specific File from Directory
```bash
# Get a specific file from within a directory
curl "http://localhost:4000/api/v1/files/QmDirectoryCID?path=document.pdf"

# Get file from subdirectory
curl "http://localhost:4000/api/v1/files/QmDirectoryCID?path=images/photo.jpg"
```

### 3. Get Single File Content
```bash
# Get file content directly
curl "http://localhost:4000/api/v1/files/QmFileCID"

# Get file metadata as JSON
curl "http://localhost:4000/api/v1/files/QmFileCID?format=json"
```

### 4. Browse Directory Programmatically

Access directory via JSON API:

```http
GET http://localhost:4000/api/v1/files/QmDirectoryCID
```

This returns structured JSON data for directory contents.

## Response Headers

The API includes helpful headers:
- `X-Content-Type`: `file`, `directory`, or `raw`
- `X-Decrypted`: `true` if content was encrypted
- `X-Content-Size`: Size in bytes for files
- `X-API-Version`: API version

## TypeScript Client Example

```typescript
import ky from 'ky';

interface DirectoryResponse {
  success: boolean;
  type: 'directory';
  cid: string;
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  files: Array<{
    name: string;
    path: string;
    cid: string;
    size: number;
    type: 'file' | 'directory' | 'raw';
  }>;
}

// Get directory structure
const response = await ky.get(`/api/v1/files/${cid}?format=json`).json<DirectoryResponse>();

// List all file paths
const filePaths = response.files
  .filter(file => file.type === 'file')
  .map(file => file.path);

// Download a specific file
const fileContent = await ky.get(`/api/v1/files/${cid}?path=${filePaths[0]}`).arrayBuffer();
```

## Implementation Details

### CID Processor Service
The `cid-processor.ts` service uses Helia/UnixFS to:
- Connect to IPFS network
- Parse CID structures
- Recursively traverse directories
- Extract file content

### Key Functions
- `processCid(cid)`: Main function to process any CID
- `getFileFromDirectory(cid, path)`: Extract specific file from directory
- `getFilePaths(cid)`: Get flattened list of all file paths

### Error Handling
- Invalid CID format returns 400
- Missing files return 404
- IPFS errors return 500 with detailed message

## Migration Notes

The updated API returns JSON by default for directory CIDs and is backward compatible for single file CIDs. New functionality is accessed via query parameters:

- `?format=json` for file metadata as JSON (instead of binary content)
- `?path=filename` for directory file access

This provides a clean, API-first approach focused on structured data responses.
