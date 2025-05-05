import { type Address, getAddress, isHex } from "viem";
import { getShortHex } from "@/lib/utils/hex";

export type GetShortAddressReturnType = string | null;

export const getShortAddress = (
	address: Address,
	sectionLength: number = 4,
): GetShortAddressReturnType => {
	if (!isHex(address) || (address as string)?.length !== 42) {
		throw new Error("Invalid Address");
	}

	const checksumed = getAddress(address);

	return getShortHex(checksumed, sectionLength);
};
