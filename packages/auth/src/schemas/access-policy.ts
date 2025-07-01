import type { AuthInput, Did } from "./input";

export type AccessPolicy = {
	policyType: string;
	policyConfig: any;
	tokenType: string;
	claims: string[];
};

export type Processor = (policyConfig: any, input: AuthInput) => boolean;

// Re-export for backward compatibility
export type { AuthInput, Did };
