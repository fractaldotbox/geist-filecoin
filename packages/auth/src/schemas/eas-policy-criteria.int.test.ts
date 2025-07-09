import { baseSepolia, sepolia } from "viem/chains";
import { describe, expect, it } from "vitest";
import { checkEasCriteria } from "./eas-policy-criteria";
import type { AuthInput, Did } from "./input";

describe("checkEasCriteria Integration Tests", () => {
	// Real EAS attestation UIDs and data for testing
	// These are actual attestations from EAS networks that we can use for integration testing
	const ATTESTATION_FIXTURE = {
		[sepolia.id]: {
			schemaUid:
				"0xebadd94211a4f129fd1803e6120cc0d68612a89f742f0008cd765302ea101dfb",
			userDid:
				"did:key:z4MXj1wBzi9jUstyNmjKfeZcLTaPupodBbLTttuqoWESMQTMXa8TyLJXNjao7vDrM4bopmhxNyy4ChP7EHxD6xa9GqD4W1bHoHH7gaF4m71bq3ef62hF3YAsGthFeGeKDrXSY7CbpMfuSEJwaGeZ5tGp3XHnTpjsKwcpMU97Sivr3FHTL26byszNAkg95g8cjYtvgpJdBRjJpxJXLn2GurFhbjzgSoH3pxFDebRyqvZ5TNsrVYHxPs4H1kQpsifsDspH8bqKa2mUMpa1jsnxmwQ8fufm5scFTjAA8xHWzhmR9k7dym8bSgqdotWi7aomQdPv83cAf87GvxuPnQSrdWyLoCBFuYH28t1B2dqbuuShfRTYJXQvc" as Did,
			chainId: sepolia.id.toString(), // Sepolia
			fieldIndex: 0,
		},
		[baseSepolia.id]: {
			// Example real attestation from Base
			schemaUid:
				"0x361af5302be41a7b72e319846943282f1a615dc2655ad867940d14bd57d65e5c",
			userDid: "did:mailto:example.com:jsmith" as Did,
			chainId: baseSepolia.id.toString(), // Base
			fieldIndex: 1,
		},

		// mainnet: {
		// 	// Example real attestation from mainnet (use actual known attestation UID)
		// 	schemaUid: "0x1234567890123456789012345678901234567890123456789012345678901234",
		// 	userDid: "did:key:abcdefabcdefabcdefabcdefabcdefabcdefabcd" as Did,
		// 	chainId: "1", // Mainnet
		// 	fieldIndex: 0,
		// },
		// optimism: {
		// 	// Example real attestation from Optimism
		// 	schemaUid: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		// 	userDid: "did:key:9876543210987654321098765432109876543210abcdefabcdefabcdefabcd" as Did,
		// 	chainId: "10", // Optimism
		// 	fieldIndex: 0,
		// },
	} as Record<
		number,
		{
			schemaUid: string;
			userDid: Did;
			chainId: string;
			fieldIndex: number;
		}
	>;

	describe("Real attestation verification", () => {
		it.each([[sepolia.id], [baseSepolia.id]])(
			"should handle testnet attestations with valid subject %s",
			async (chainId: number) => {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const fixture = ATTESTATION_FIXTURE[chainId]!;

				const authInput: AuthInput = {
					subject: fixture.userDid,
					context: {
						env: {},
					},
				};

				const result = await checkEasCriteria(fixture, authInput);

				expect(result).toBe(true);
			},
			30000,
		);
	});

	describe("Invalid attestation scenarios", () => {
		it("should return false for non-existent attestation", async () => {
			const policyConfig = {
				schemaUid:
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				fieldIndex: 0,
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

		it("should return false for subject not in any existing attestation", async () => {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const fixture = ATTESTATION_FIXTURE[sepolia.id]!;

			const authInput: AuthInput = {
				subject: "did:key:1234567890123456789012345678901234567890" as Did,
				context: {
					env: {},
				},
				resource: "/test/resource",
			};

			const result = await checkEasCriteria(fixture, authInput);
			// This should return false since the subject doesn't match the attestation userDid
			expect(result).toBe(false);
		}, 30000);

		it("should return false for unsupported chain ID", async () => {
			const policyConfig = {
				schemaUid:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				fieldIndex: 0,
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
		it("should handle field index out of bounds", async () => {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const fixture = ATTESTATION_FIXTURE[sepolia.id]!;

			const policyConfig = {
				...fixture,
				fieldIndex: 1, // Different field index
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

	describe("Error handling and resilience", () => {
		it("should handle network errors gracefully", async () => {
			const policyConfig = {
				schemaUid:
					"0x1234567890123456789012345678901234567890123456789012345678901234",
				fieldIndex: 0,
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
				fieldIndex: 0,
				chainId: sepolia.id.toString(),
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
				fieldIndex: 0,
				chainId: sepolia.id.toString(),
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
});
