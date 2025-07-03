export enum StorageProvider {
  STORACHA = 'storacha',
  S3 = 's3',
  LIGHTHOUSE = 'lighthouse',
  IPFS = 'ipfs',
}

export type StorageProviderType = StorageProvider;

export interface StorageProviderConfig {
  value: StorageProvider;
  label: string;
  description: string;
  instructions: string;
}

export const STORAGE_PROVIDERS: StorageProviderConfig[] = [
  {
    value: StorageProvider.STORACHA,
    label: 'Storacha',
    description: 'Web3 storage powered by IPFS',
    instructions: 'Create a storacha space on https://console.storacha.network/ and enter the did key',
  },
  {
    value: StorageProvider.S3,
    label: 'Amazon S3',
    description: 'Amazon Simple Storage Service',
    instructions: 'Configure AWS credentials and bucket settings',
  },
  {
    value: StorageProvider.LIGHTHOUSE,
    label: 'Lighthouse',
    description: 'Decentralized storage with encryption',
    instructions: 'Get API key from https://lighthouse.storage/',
  },
  {
    value: StorageProvider.IPFS,
    label: 'IPFS',
    description: 'InterPlanetary File System',
    instructions: 'Direct IPFS gateway access',
  },
];

export const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
  [StorageProvider.STORACHA]: 'Storacha',
  [StorageProvider.S3]: 'Amazon S3',
  [StorageProvider.LIGHTHOUSE]: 'Lighthouse',
  [StorageProvider.IPFS]: 'IPFS',
};
