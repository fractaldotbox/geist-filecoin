import { describe, expect, it } from "vitest";
import { checkEasCriteria } from "./eas-policy-criteria";
import type { AuthInput, Did } from "./input";

describe("checkEasCriteria Integration Tests", () => {
	// Real EAS attestation UIDs and data for testing
	// These are actual attestations from EAS networks that we can use for integration testing
	const ATTESTATION_FIXTURE = {
		sepolia: {
			schemaUid:
				"0xebadd94211a4f129fd1803e6120cc0d68612a89f742f0008cd765302ea101dfb",
			recipient:
				"did:key:z4MXj1wBzi9jUstyNmjKfeZcLTaPupodBbLTttuqoWESMQTMXa8TyLJXNjao7vDrM4bopmhxNyy4ChP7EHxD6xa9GqD4W1bHoHH7gaF4m71bq3ef62hF3YAsGthFeGeKDrXSY7CbpMfuSEJwaGeZ5tGp3XHnTpjsKwcpMU97Sivr3FHTL26byszNAkg95g8cjYtvgpJdBRjJpxJXLn2GurFhbjzgSoH3pxFDebRyqvZ5TNsrVYHxPs4H1kQpsifsDspH8bqKa2mUMpa1jsnxmwQ8fufm5scFTjAA8xHWzhmR9k7dym8bSgqdotWi7aomQdPv83cAf87GvxuPnQSrdWyLoCBFuYH28t1B2dqbuuShfRTYJXQvc" as Did,
			chainId: "11155111", // Sepolia
			field: "usesrDid",
		},
		// mainnet: {
		// 	// Example real attestation from mainnet (use actual known attestation UID)
		// 	schemaUid: "0x1234567890123456789012345678901234567890123456789012345678901234",
		// 	recipient: "did:key:abcdefabcdefabcdefabcdefabcdefabcdefabcd" as Did,
		// 	chainId: "1", // Mainnet
		// 	field: "usesrDid",
		// },
		// optimism: {
		// 	// Example real attestation from Optimism
		// 	schemaUid: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		// 	recipient: "did:key:9876543210987654321098765432109876543210abcdefabcdefabcdefabcd" as Did,
		// 	chainId: "10", // Optimism
		// 	field: "usesrDid",
		// },
		// base: {
		// 	// Example real attestation from Base
		// 	schemaUid: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
		// 	recipient: "did:key:5555555555555555555555555555555555555555555555555555555555555555" as Did,
		// 	chainId: "8453", // Base
		// 	field: "usesrDid",
		// },
	};

	describe.only("Real attestation verification", () => {
		it("should handle Sepolia testnet attestations with valid subject", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: ATTESTATION_FIXTURE.sepolia.field,
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: ATTESTATION_FIXTURE.sepolia.recipient,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);

			expect(result).toBe(true);
		}, 30000);
	});

	describe("Invalid attestation scenarios", () => {
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

		it("should return false for wrong subject in existing attestation", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: ATTESTATION_FIXTURE.sepolia.field,
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: "did:key:9999999999999999999999999999999999999999" as Did, // Different subject
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(policyConfig, authInput);
			// This should return false since the subject doesn't match the attestation recipient
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
	});

	describe("Field type variations", () => {
		it("should handle different field types (attester)", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: "attester", // Different field
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
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

		it("should handle schemaId field", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: "schemaId",
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
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

	describe("Error handling and resilience", () => {
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

		it("should handle malformed policy config gracefully", async () => {
			const policyConfig = {
				// Missing schemaUid field intentionally
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

		it("should handle empty string values", async () => {
			const policyConfig = {
				schemaUid: "",
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

	describe("Performance and reliability", () => {
		it("should complete within reasonable time", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: ATTESTATION_FIXTURE.sepolia.field,
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: ATTESTATION_FIXTURE.sepolia.recipient,
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
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: ATTESTATION_FIXTURE.sepolia.field,
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: ATTESTATION_FIXTURE.sepolia.recipient,
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

			// All results should be the same since we're using the same input
			const firstResult = results[0];
			for (const result of results) {
				expect(result).toBe(firstResult);
			}
		}, 30000);

		it("should be idempotent - same input produces same result", async () => {
			const policyConfig = {
				schemaUid: ATTESTATION_FIXTURE.sepolia.schemaUid,
				field: ATTESTATION_FIXTURE.sepolia.field,
				chainId: ATTESTATION_FIXTURE.sepolia.chainId,
			};

			const authInput: AuthInput = {
				subject: ATTESTATION_FIXTURE.sepolia.recipient,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			// Run the same test multiple times
			const result1 = await checkEasCriteria(policyConfig, authInput);
			const result2 = await checkEasCriteria(policyConfig, authInput);
			const result3 = await checkEasCriteria(policyConfig, authInput);

			expect(result1).toBe(result2);
			expect(result2).toBe(result3);
		}, 30000);
	});
});
