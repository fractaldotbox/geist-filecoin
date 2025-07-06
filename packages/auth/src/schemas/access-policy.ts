import type { AuthInput, Did } from "./input";

export type Access = {
	claims: string[];
	metadata: Record<string, string>;
};

export type AccessPolicy = {
	id: string;
	tokenType: string;
	criteriaType: string;
	criteria: Record<string, any>;
	access: Access;
};

export type Processor = (policyConfig: any, input: AuthInput) => boolean;

// Re-export for backward compatibility
export type { AuthInput, Did };
