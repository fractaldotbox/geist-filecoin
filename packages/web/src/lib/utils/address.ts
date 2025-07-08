import { getShortForm } from "@/lib/utils/string";
import { type Address, getAddress, isHex } from "viem";

export type GetShortAddressReturnType = string | null;

export const getShortAddress = (
	address: Address,
	sectionLength = 4,
): GetShortAddressReturnType => {
	if (!isHex(address) || (address as string)?.length !== 42) {
		throw new Error("Invalid Address");
	}

	const checksumed = getAddress(address);

	return getShortForm(checksumed, sectionLength);
};
