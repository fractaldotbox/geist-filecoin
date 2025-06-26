declare global {
	interface ImportMeta {
		env: Record<string, string | undefined>;
	}
}

declare const process:
	| {
			env: Record<string, string | undefined>;
	  }
	| undefined;

export {};
