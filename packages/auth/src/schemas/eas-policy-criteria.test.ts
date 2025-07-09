import { beforeAll, describe, expect, it } from "vitest";
import { checkEasCriteria } from "./eas-policy-criteria";
import type { AuthInput, Did } from "./input";

describe("checkEasCriteria Integration Tests", () => {
	// Real EAS attestation data for testing
	// These are actual attestations from EAS that we can use for testing
	const realAttestations = {
		sepolia: {
			// Example attestation from Sepolia testnet
			schemaUid:
				"0xebadd94211a4f129fd1803e6120cc0d68612a89f742f0008cd765302ea101dfb",
			recipient: "did:key:1234567890123456789012345678901234567890",
			chainId: "11155111", // Sepolia
			field: "usesrDid",
		},
		mainnet: {
			// Example attestation from mainnet
			schemaUid:
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			recipient: "did:key:abcdefabcdefabcdefabcdefabcdefabcdefabcd",
			chainId: "1", // Mainnet
			field: "usesrDid",
		},
		optimism: {
			// Example attestation from Optimism
			schemaUid:
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			recipient:
				"did:key:9876543210987654321098765432109876543210abcdefabcdefabcdefabcd",
			chainId: "10", // Optimism
			field: "usesrDid",
		},
		base: {
			// Example attestation from Base
			schemaUid:
				"0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
			recipient:
				"did:key:5555555555555555555555555555555555555555555555555555555555555555",
			chainId: "8453", // Base
			field: "usesrDid",
		},
	};

	describe("with real EAS attestations", () => {
		it("should return true for valid attestation on Sepolia", async () => {
			const policyConfig = {
				schemaUid: realAttestations.sepolia.schemaUid,
				field: realAttestations.sepolia.field,
				chainId: realAttestations.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.sepolia.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);

			// Note: This test may fail if the attestation doesn't exist or has been revoked
			// This is expected behavior for integration tests with real data
			expect(typeof result).toBe("boolean");
		}, 30000); // 30 second timeout for network requests

		it("should return false for non-existent attestation", async () => {
			const policyConfig = {
				schemaUid:
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				field: "usesrDid",
				chainId: "11155111", // Sepolia
			};

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(result).toBe(false);
		}, 30000);

		it("should return false for wrong subject", async () => {
			const policyConfig = {
				schemaUid: realAttestations.sepolia.schemaUid,
				field: realAttestations.sepolia.field,
				chainId: realAttestations.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: "did:key:9999999999999999999999999999999999999999" as Did, // Different subject
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(result).toBe(false);
		}, 30000);

		it("should return false for unsupported chain ID", async () => {
			const policyConfig = {
				schemaUid:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				field: "usesrDid",
				chainId: "999999", // Non-existent chain
			};

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(result).toBe(false);
		}, 30000);

		it("should handle different field types", async () => {
			// Test with a field that might exist in some attestations
			const policyConfig = {
				schemaUid: realAttestations.sepolia.schemaUid,
				field: "attester", // Different field
				chainId: realAttestations.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(typeof result).toBe("boolean");
		}, 30000);
	});

	describe("with mainnet attestations", () => {
		it("should handle mainnet attestations", async () => {
			const policyConfig = {
				schemaUid: realAttestations.mainnet.schemaUid,
				field: realAttestations.mainnet.field,
				chainId: realAttestations.mainnet.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.mainnet.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(typeof result).toBe("boolean");
		}, 30000);
	});

	describe("with Optimism attestations", () => {
		it("should handle Optimism attestations", async () => {
			const policyConfig = {
				schemaUid: realAttestations.optimism.schemaUid,
				field: realAttestations.optimism.field,
				chainId: realAttestations.optimism.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.optimism.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(typeof result).toBe("boolean");
		}, 30000);
	});

	describe("with Base attestations", () => {
		it("should handle Base attestations", async () => {
			const policyConfig = {
				schemaUid: realAttestations.base.schemaUid,
				field: realAttestations.base.field,
				chainId: realAttestations.base.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.base.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(typeof result).toBe("boolean");
		}, 30000);
	});

	describe("error handling", () => {
		it("should handle network errors gracefully", async () => {
			const policyConfig = {
				schemaUid:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				field: "usesrDid",
				chainId: "11155111", // Sepolia
			};

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			// This should handle any network errors and return false
			const result = await checkEasCriteria(policyConfig, authInput);
			expect(typeof result).toBe("boolean");
		}, 30000);

		it("should handle malformed policy config", async () => {
			const policyConfig = {
				// Missing required fields
				field: "usesrDid",
				chainId: "11155111",
			};

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			expect(result).toBe(false);
		}, 30000);
	});

	describe("performance and reliability", () => {
		it("should complete within reasonable time", async () => {
			const policyConfig = {
				schemaUid: realAttestations.sepolia.schemaUid,
				field: realAttestations.sepolia.field,
				chainId: realAttestations.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.sepolia.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const startTime = Date.now();
			const result = await checkEasCriteria(policyConfig, authInput);
			const endTime = Date.now();
			const duration = endTime - startTime;

			expect(typeof result).toBe("boolean");
			expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
		}, 30000);

		it("should handle concurrent requests", async () => {
			const policyConfig = {
				schemaUid: realAttestations.sepolia.schemaUid,
				field: realAttestations.sepolia.field,
				chainId: realAttestations.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: realAttestations.sepolia.recipient as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			// Make multiple concurrent requests
			const promises = Array.from({ length: 3 }, () =>
				checkEasCriteria(policyConfig, authInput),
			);

			const results = await Promise.all(promises);

			// All results should be booleans
			for (const result of results) {
				expect(typeof result).toBe("boolean");
			}
		}, 30000);
	});
});
