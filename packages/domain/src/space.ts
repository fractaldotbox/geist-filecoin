import type { StorageProvider, StorageProviderCredentialConfig } from "./storage-provider";

export type Space = {
    id: string;
    name: string;
    description: string;
    storageProvider: StorageProvider;
    storageProviderId: string;
    storageProviderCredentials: StorageProviderCredentialConfig[];
}