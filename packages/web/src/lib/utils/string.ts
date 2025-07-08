import type { Hex } from "viem";

export type GetShortFormReturnType = string | null;

export const getShortForm = (
	input: string,
	sectionLength = 6,
): GetShortFormReturnType => {
	return [input.slice(0, sectionLength), input.slice(-sectionLength)].join(
		"...",
	);
};

export const truncate = (stringToTruncate: string, threshold = 15) => {
	if (stringToTruncate.length <= threshold) {
		return stringToTruncate;
	}
	return stringToTruncate.slice(-threshold).concat("...");
};
