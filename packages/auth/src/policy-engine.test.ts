import { beforeEach, describe, expect, it } from "vitest";
import { processRules } from "./policy-engine";
import type { AccessPolicy, AuthInput } from "./schemas/access-policy";

describe("processRules", () => {
	let mockAuthInput: AuthInput;
	let envPolicy: AccessPolicy;

	beforeEach(() => {
		mockAuthInput = {
			subject: "did:key:test123",
			context: {},
			resource: "/test/resource",
			env: {
				GEIST_USER: "did:key:test123,did:key:test456",
				OTHER_USER: "did:key:other123",
			},
		};

		envPolicy = {
			policyType: "env",
			policyConfig: {
				whitelistEnvKey: "GEIST_USER",
			},
			tokenType: "access",
			claims: ["read", "write"],
		};
	});

	describe("with env-policy-criteria", () => {
		it("should return claims when subject is in whitelist", async () => {
			const policies = [envPolicy];
			const result = await processRules(policies, mockAuthInput);
			expect(result.has("access")).toBe(true);
			expect(result.get("access")).toEqual(new Set(["read", "write"]));
		});

		it("should return empty map when subject is not in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithDifferentSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:unauthorized",
			};

			const result = await processRules(policies, inputWithDifferentSubject);
			expect(result.size).toBe(0);
		});

		it("should return empty map when whitelist env variable is not set", async () => {
			const policies = [envPolicy];
			const inputWithoutEnv: AuthInput = {
				...mockAuthInput,
				env: {},
			};

			const result = await processRules(policies, inputWithoutEnv);
			expect(result.size).toBe(0);
		});

		it("should return empty map when whitelist env variable is empty", async () => {
			const policies = [envPolicy];
			const inputWithEmptyEnv: AuthInput = {
				...mockAuthInput,
				env: {
					GEIST_USER: "",
				},
			};

			const result = await processRules(policies, inputWithEmptyEnv);
			expect(result.size).toBe(0);
		});

		it("should handle multiple DIDs in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithSecondSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:test456",
			};

			const result = await processRules(policies, inputWithSecondSubject);
			expect(result.has("access")).toBe(true);
			expect(result.get("access")).toEqual(new Set(["read", "write"]));
		});

		it("should handle single DID in whitelist", async () => {
			const policies = [envPolicy];
			const inputWithSingleWhitelist: AuthInput = {
				...mockAuthInput,
				env: {
					GEIST_USER: "did:key:test123",
				},
			};

			const result = await processRules(policies, inputWithSingleWhitelist);
			expect(result.has("access")).toBe(true);
			expect(result.get("access")).toEqual(new Set(["read", "write"]));
		});

		it("should return empty map for unknown policy type", async () => {
			const unknownPolicy: AccessPolicy = {
				policyType: "unknown",
				policyConfig: {},
				tokenType: "access",
				claims: ["read"],
			};

			const policies = [unknownPolicy];
			const result = await processRules(policies, mockAuthInput);
			expect(result.size).toBe(0);
		});

		it("should return claims if any policy allows access (allowlist behavior)", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyConfig: {
					whitelistEnvKey: "OTHER_USER",
				},
				tokenType: "access",
				claims: ["read"],
			};

			const policies = [envPolicy, envPolicy2];
			const inputWithOtherSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:other123",
			};

			const result = await processRules(policies, inputWithOtherSubject);
			expect(result.has("access")).toBe(true);
			expect(result.get("access")).toEqual(new Set(["read"]));
		});

		it("should return empty map when no policies allow access", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyConfig: {
					whitelistEnvKey: "OTHER_USER",
				},
				tokenType: "access",
				claims: ["read"],
			};

			const policies = [envPolicy, envPolicy2];
			const inputWithUnauthorizedSubject: AuthInput = {
				...mockAuthInput,
				subject: "did:key:unauthorized",
			};

			const result = await processRules(policies, inputWithUnauthorizedSubject);
			expect(result.size).toBe(0);
		});

		it("should handle empty policies array", async () => {
			const policies: AccessPolicy[] = [];
			const result = await processRules(policies, mockAuthInput);
			expect(result.size).toBe(0);
		});

		it("should aggregate claims from multiple policies with same token type", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyConfig: {
					whitelistEnvKey: "GEIST_USER",
				},
				tokenType: "access",
				claims: ["delete", "admin"],
			};

			const policies = [envPolicy, envPolicy2];
			const result = await processRules(policies, mockAuthInput);
			expect(result.has("access")).toBe(true);
			expect(result.get("access")).toEqual(
				new Set(["read", "write", "delete", "admin"]),
			);
		});

		it("should handle different token types separately", async () => {
			const envPolicy2: AccessPolicy = {
				policyType: "env",
				policyConfig: {
					whitelistEnvKey: "GEIST_USER",
				},
				tokenType: "refresh",
				claims: ["refresh"],
			};

			const policies = [envPolicy, envPolicy2];
			const result = await processRules(policies, mockAuthInput);
			expect(result.has("access")).toBe(true);
			expect(result.has("refresh")).toBe(true);
			expect(result.get("access")).toEqual(new Set(["read", "write"]));
			expect(result.get("refresh")).toEqual(new Set(["refresh"]));
		});
	});
});
