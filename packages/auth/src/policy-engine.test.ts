import { match } from "ts-pattern";
import { beforeEach, describe, expect, it } from "vitest";
import { processPolicies } from "./policy-engine";
import type { AccessPolicy, AuthInput } from "./schemas/access-policy";

describe("processPolicies", () => {
	let mockAuthInput: AuthInput;
	let envPolicy: AccessPolicy;

	beforeEach(() => {
		mockAuthInput = {
			subject: "did:key:test123",
			context: {
				env: {
					GEIST_USER: "did:key:test123,did:key:test456",
					OTHER_USER: "did:key:other123",
				},
			},
			resource: "/test/resource",
		};

		envPolicy = {
			policyType: "env",
			policyCriteria: {
				whitelistEnvKey: "GEIST_USER",
			},
			tokenType: "access",
			policyAccess: {
				claims: ["read", "write"],
				metadata: {},
			},
		};
	});

	describe("with env-policy-criteria", () => {
		it("should return claims when subject is in whitelist", async () => {
			const policies = [envPolicy];
			const result = await processPolicies(policies, mockAuthInput);
			expect(result.access).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["read", "write"]);
			}
		});

		it("should return empty map when subject is not in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithDifferentSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:unauthorized",
			};

			const result = await processPolicies(policies, inputWithDifferentSubject);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should return empty map when whitelist env variable is not set", async () => {
			const policies = [envPolicy];
			const inputWithoutEnv: AuthInput = {
				...mockAuthInput,
				context: {
					env: {},
				},
			};

			const result = await processPolicies(policies, inputWithoutEnv);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should return empty map when whitelist env variable is empty", async () => {
			const policies = [envPolicy];
			const inputWithEmptyEnv: AuthInput = {
				...mockAuthInput,
				context: {
					env: {
						GEIST_USER: "",
					},
				},
			};

			const result = await processPolicies(policies, inputWithEmptyEnv);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should handle multiple DIDs in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithSecondSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:test456",
			};

			const result = await processPolicies(policies, inputWithSecondSubject);
			expect(result.access).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["read", "write"]);
			}
		});

		it("should handle single DID in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithSingleWhitelist: AuthInput = {
				...mockAuthInput,
			};

			const result = await processPolicies(policies, inputWithSingleWhitelist);
			expect(result.access).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["read", "write"]);
			}
		});

		it("should return empty map for unknown policy type", async () => {
			const unknownPolicy: AccessPolicy = {
				policyType: "unknown",
				policyCriteria: {},
				tokenType: "access",
				policyAccess: {
					claims: ["read"],
					metadata: {},
				},
			};

			const policies = [unknownPolicy];
			const result = await processPolicies(policies, mockAuthInput);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should return claims if any policy allows access (allowlist behavior)", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyCriteria: {
					whitelistEnvKey: "OTHER_USER",
				},
				tokenType: "access",
				policyAccess: {
					claims: ["read"],
					metadata: {},
				},
			};

			const policies = [envPolicy, envPolicy2];
			const inputWithOtherSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:other123",
			};

			const result = await processPolicies(policies, inputWithOtherSubject);
			expect(result.access).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["read"]);
			}
		});

		it("should return empty map when no policies allow access", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyCriteria: {
					whitelistEnvKey: "OTHER_USER",
				},
				tokenType: "access",
				policyAccess: {
					claims: ["read"],
					metadata: {},
				},
			};

			const policies = [envPolicy, envPolicy2];
			const inputWithUnauthorizedSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:unauthorized",
			};

			const result = await processPolicies(
				policies,
				inputWithUnauthorizedSubject,
			);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should handle empty policies array", async () => {
			const policies: AccessPolicy[] = [];
			const result = await processPolicies(policies, mockAuthInput);
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should aggregate claims from multiple policies with same token type", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyCriteria: {
					whitelistEnvKey: "GEIST_USER",
				},
				tokenType: "access",
				policyAccess: {
					claims: ["delete", "admin"],
					metadata: {},
				},
			};

			const policies = [envPolicy, envPolicy2];
			const result = await processPolicies(policies, mockAuthInput);
			expect(result.access).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["delete", "admin"]);
			}
		});

		it("should handle different token types separately", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyCriteria: {
					whitelistEnvKey: "GEIST_USER",
				},
				tokenType: "refresh",
				policyAccess: {
					claims: ["refresh"],
					metadata: {},
				},
			};

			const policies = [envPolicy, envPolicy2];
			const result = await processPolicies(policies, mockAuthInput);
			expect(result.access).toBeDefined();
			expect(result.refresh).toBeDefined();
			if (result.access) {
				expect(result.access.claims).toEqual(["read", "write"]);
			}
			if (result.refresh) {
				expect(result.refresh.claims).toEqual(["refresh"]);
			}
		});
	});
});
