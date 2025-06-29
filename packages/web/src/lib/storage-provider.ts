// TODO point to secrets for values

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
