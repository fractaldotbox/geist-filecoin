import { describe, expect, it } from "vitest";
import { getShortAddress } from "./address";

describe("getShortAddress", () => {
	const validAddress = "0x742d35Cc6634C0532925a3b8D6A521D2C0C5C0F6";
	const validAddressLowercase = "0x742d35cc6634c0532925a3b8d6a521d2c0c5c0f6";
	const checksummedAddress = "0x742d35Cc6634C0532925a3b8D6A521D2C0C5C0F6";

	describe("with valid addresses", () => {
		it("should return shortened address with default section length", () => {
			const result = getShortAddress(validAddress);
			expect(result).toBe("0x742D...C0F6");
		});

		it("should return shortened address with custom section length", () => {
			const result = getShortAddress(validAddress, 6);
			expect(result).toBe("0x742D35...c5C0F6");
		});

		it("should handle lowercase addresses and return checksummed result", () => {
			const result = getShortAddress(validAddressLowercase);
			expect(result).toBe("0x742D...C0F6");
		});

		it("should work with section length of 1", () => {
			const result = getShortAddress(validAddress, 1);
			expect(result).toBe("0x7...6");
		});

		it("should work with section length of 8", () => {
			const result = getShortAddress(validAddress, 8);
			expect(result).toBe("0x742D35cC...C0c5C0F6");
		});

		it("should work with maximum practical section length", () => {
			const result = getShortAddress(validAddress, 18);
			expect(result).toBe("0x742D35cC6634c05329...b8d6a521d2C0c5C0F6");
		});
	});

	describe("with invalid addresses", () => {
		it("should throw error for non-hex string", () => {
			expect(() => getShortAddress("not-a-hex-string" as any)).toThrow("Invalid Address");
		});

		it("should throw error for hex string with wrong length (too short)", () => {
			expect(() => getShortAddress("0x742d35Cc" as any)).toThrow("Invalid Address");
		});

		it("should throw error for hex string with wrong length (too long)", () => {
			expect(() => getShortAddress("0x742d35Cc6634C0532925a3b8D6A521D2C0C5C0F6FF" as any)).toThrow("Invalid Address");
		});

		it("should throw error for missing 0x prefix", () => {
			expect(() => getShortAddress("742d35Cc6634C0532925a3b8D6A521D2C0C5C0F6" as any)).toThrow("Invalid Address");
		});

		it("should throw error for empty string", () => {
			expect(() => getShortAddress("" as any)).toThrow("Invalid Address");
		});

		it("should throw error for hex string with invalid characters", () => {
			expect(() => getShortAddress("0x742d35Gc6634C0532925a3b8D6A521D2C0C5C0F6" as any)).toThrow("Invalid Address");
		});
	});

	describe("edge cases", () => {
		it("should handle all zeros address", () => {
			const zeroAddress = "0x0000000000000000000000000000000000000000";
			const result = getShortAddress(zeroAddress);
			expect(result).toBe("0x0000...0000");
		});

		it("should handle all f's address", () => {
			const maxAddress = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
			const result = getShortAddress(maxAddress);
			expect(result).toBe("0xFFfF...FFfF");
		});

		it("should return consistent results for same address", () => {
			const result1 = getShortAddress(validAddress);
			const result2 = getShortAddress(validAddress);
			expect(result1).toBe(result2);
		});

		it("should return same result for lowercase and checksummed versions", () => {
			const result1 = getShortAddress(validAddressLowercase);
			const result2 = getShortAddress(checksummedAddress);
			expect(result1).toBe(result2);
		});
	});

	describe("return type", () => {
		it("should return string for valid address", () => {
			const result = getShortAddress(validAddress);
			expect(typeof result).toBe("string");
		});

		it("should match the expected return type", () => {
			const result = getShortAddress(validAddress);
			expect(result).toMatch(/^0x[0-9a-fA-F]+\.\.\.[0-9a-fA-F]+$/);
		});
	});
}); 