export type Did = `did:${string}`;

// Current request intent to be validated
// Try to model with reference to rego https://play.openpolicyagent.org/
// Currently we don' handle action in input
export type AuthInput = {
	// user in rego
	subject: Did;
	// data in rego
	context?: {
		env: Record<string, string>;
		[key: string]: any;
	};
	resource?: string;
};
