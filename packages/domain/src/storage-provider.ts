export enum StorageProvider {
	Storacha = "storacha",
	S3 = "s3",
}

export type StorageProviderCredentialConfig =
	| {
			type: "secret-ref";
			key: string;
			valueFrom: string;
	  }
	| {
			type: "value";
			key: string;
			value: string;
	  };

export const loadCredentials = (configs: StorageProviderCredentialConfig[]) => {
	return Object.fromEntries(
		configs.map((config) => {
			if (config.type === "secret-ref") {
				// TODO: load credentials from secrets
				return [config.key, config.valueFrom];
			}

			return [config.key, config.value];
		}),
	);
};

export interface StorageProviderConfig {
	value: StorageProvider;
	label: string;
	description: string;
	instructions: string;
}


export const STORAGE_PROVIDERS: StorageProviderConfig[] = [
	{
		value: StorageProvider.Storacha,
		label: "Storacha",
		description: "Web3 storage powered by IPFS",
		instructions:
			"Create a storacha space on https://console.storacha.network/ and enter the did key",
	},
	{
		value: StorageProvider.S3,
		label: "Amazon S3",
		description: "Amazon Simple Storage Service",
		instructions: "",
	},
];