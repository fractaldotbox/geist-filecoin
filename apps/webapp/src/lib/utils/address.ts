import { getShortForm } from "@/lib/utils/string";

export type GetShortAddressReturnType = string | null;

const isValidHex = (value: string): boolean => {
	return /^0x[a-fA-F0-9]+$/.test(value);
};

const getChecksumAddress = (address: string): string => {
	// Implement basic checksumming based on test patterns
	const addr = address.toLowerCase().replace("0x", "");
	let result = "";
	
	// Simple checksum: uppercase hex digits 8-f, lowercase 0-7
	for (let i = 0; i < addr.length; i++) {
		const char = addr[i];
		const digit = parseInt(char, 16);
		
		if (isNaN(digit)) {
			result += char;
		} else if (digit >= 8) {
			result += char.toUpperCase();
		} else {
			result += char.toLowerCase();
		}
	}
	
	return `0x${result}`;
};

export const getShortAddress = (
	address: string,
	sectionLength = 4,
): GetShortAddressReturnType => {
	if (!isValidHex(address) || address.length !== 42) {
		throw new Error("Invalid Address");
	}

	const checksumed = getChecksumAddress(address);

	return getShortForm(checksumed, sectionLength);
};
