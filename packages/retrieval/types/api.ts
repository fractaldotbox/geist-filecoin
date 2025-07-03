import type { StorageProvider, StorageProviderType } from '@geist-filecoin/storage';

export interface FileEntry {
  name: string;
  path: string;
  cid: string;
  size: number;
  type: 'file' | 'directory' | 'raw';
  content?: Uint8Array;
}

export interface DirectoryStructure {
  cid: string;
  type: 'directory';
  name?: string;
  files: FileEntry[];
  totalSize: number;
}

export interface FileContent {
  cid: string;
  type: 'file' | 'raw';
  content: Uint8Array;
  size: number;
  isEncrypted?: boolean;
}

export type CIDProcessResult = DirectoryStructure | FileContent;

export interface FileMetadata {
  cid: string;
  name: string;
  size: number;
  created: string;
  shards: string[];
}

export interface SpaceFilesResponse {
  spaceDid: string;
  files: FileMetadata[];
  total: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: {
    node: string;
    platform: string;
    arch: string;
  };
  services: {
    storacha: {
      configured: boolean;
      status: 'ready' | 'not_configured' | 'error';
    };
    encryption: {
      configured: boolean;
      status: 'ready' | 'using_default_key' | 'error';
    };
  };
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: {
    health: string;
    files: string;
    filesUnencrypted: string;
    spaces: string;
  };
  supportedProviders: StorageProvider[];
  documentation: string;
}
