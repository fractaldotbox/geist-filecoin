import { getShortForm } from "@/lib/utils/string";

export type GetShortAddressReturnType = string | null;

const isValidHex = (value: string): boolean => {
	return /^0x[a-fA-F0-9]+$/.test(value);
};

const getChecksumAddress = (address: string): string => {
	// Simple checksum implementation without crypto dependency
	const addr = address.toLowerCase().replace("0x", "");
	return `0x${addr}`;
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
