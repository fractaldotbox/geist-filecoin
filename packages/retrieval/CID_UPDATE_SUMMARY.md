# CID Processing Update for Geist Filecoin Retrieval

## Summary

Updated the retrieval package to handle CIDs that may point to files, directories, or raw data using Helia/UnixFS, following the provided example implementation.

## Key Changes

### 1. Added Dependencies
- `@helia/unixfs`: UnixFS support for Helia
- `@helia/interface`: TypeScript interfaces for Helia
- `helia`: Core Helia IPFS implementation
- `multiformats`: CID parsing and handling

### 2. New Service: `cid-processor.ts`
Implements the core CID processing logic:
- **`processCid(cid)`**: Main function that determines CID type and returns appropriate content
- **`getFileFromDirectory(cid, path)`**: Extract specific files from directories
- **`getFilePaths(cid)`**: Get flattened list of all file paths in a directory
- **Helia instance management**: Singleton pattern for IPFS connection

### 3. Updated API Route: `/api/v1/files/[cid]/route.ts`
Enhanced to support:
- **Directory listing**: HTML and JSON formats
- **File extraction from directories**: Using `?path=` parameter
- **Content type detection**: Automatic MIME type detection
- **Multiple response formats**: Browser-friendly HTML or structured JSON

### 4. Enhanced Type Definitions
Added new interfaces in `types/api.ts`:
- `FileEntry`: Individual file/directory entries
- `DirectoryStructure`: Complete directory information
- `FileContent`: File content with metadata
- `CIDProcessResult`: Union type for all possible results

## Usage Examples

### Basic File Access
```
GET /api/v1/files/QmFileCID
```

### Directory Listing (HTML)
```
GET /api/v1/files/QmDirectoryCID
```

### Directory Listing (JSON)
```
GET /api/v1/files/QmDirectoryCID?format=json
```

### Specific File from Directory
```
GET /api/v1/files/QmDirectoryCID?path=folder/file.txt
```

## Architecture

```
Browser/Client
     ↓
API Route (/api/v1/files/[cid])
     ↓
CID Processor Service
     ↓
Helia/UnixFS ← → IPFS Network
     ↓
Encryption Service (existing)
     ↓
Response (HTML/JSON/Binary)
```

## Key Features

1. **Automatic Type Detection**: Determines if CID is file, directory, or raw data
2. **Recursive Directory Processing**: Handles nested directory structures
3. **Backward Compatibility**: Existing file CID endpoints work unchanged
4. **Browser-Friendly**: HTML directory listings for web browsing
5. **Encryption Support**: Maintains existing encryption/decryption functionality
6. **Error Handling**: Proper HTTP status codes and error messages

## Implementation Notes

- Uses singleton Helia instance for efficiency
- Supports both encrypted and unencrypted content
- Provides detailed response headers for client identification
- Includes content type detection for common file formats
- Maintains turborepo/monorepo compatibility

This implementation provides a robust foundation for handling any IPFS CID type while maintaining the existing API contract and adding powerful new directory browsing capabilities.
