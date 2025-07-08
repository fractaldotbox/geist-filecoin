import type { Hex } from "viem";

export type GetShortFormReturnType = string | null;

export const getShortForm = (
	input: string,
	sectionLength = 4,
): GetShortFormReturnType => {
	return [input.slice(0, sectionLength + 2), input.slice(-sectionLength)].join(
		"...",
	);
};

export const truncate = (stringToTruncate: string, threshold = 15) => {
	if (stringToTruncate.length <= threshold) {
		return stringToTruncate;
	}
	return stringToTruncate.slice(-threshold).concat("...");
};
