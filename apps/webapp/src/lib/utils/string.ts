export type GetShortFormReturnType = string | null;

export const getShortForm = (
	input: string,
	sectionLength = 6,
): GetShortFormReturnType => {
	// For addresses starting with 0x, we need to handle the prefix properly
	if (input.startsWith("0x")) {
		const prefix = "0x";
		const addressPart = input.slice(2);
		const startSection = addressPart.slice(0, sectionLength);
		const endSection = addressPart.slice(-sectionLength);
		return `${prefix}${startSection}...${endSection}`;
	}
	
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
