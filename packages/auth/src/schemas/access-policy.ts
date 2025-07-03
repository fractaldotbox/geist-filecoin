import type { AuthInput, Did } from "./input";

export type Access = {
	claims: string[];
	metadata: Record<string, string>;
};

export type AccessPolicy = {
	tokenType: string;
	policyType: string;
	policyCriteria: Record<string, any>;
	policyAccess: Access;
};

export type Processor = (policyConfig: any, input: AuthInput) => boolean;

// Re-export for backward compatibility
export type { AuthInput, Did };
