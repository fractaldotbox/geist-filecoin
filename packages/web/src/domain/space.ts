import type { StorageProvider } from "@/constants/storage-providers";
import type { StorageProviderCredentialConfig } from "@/lib/storage-provider";

// TODO figure out best practices to align with sqlite schema
export interface Space {
    id: string;
    name: string;
    description: string;
    storageProvider: StorageProvider;
    storageProviderId: string;
    storageProviderCredentials: StorageProviderCredentialConfig[];
}