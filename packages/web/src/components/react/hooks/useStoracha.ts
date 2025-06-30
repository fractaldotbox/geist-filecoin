import apiClient, { auth } from "@/lib/api-client";
import type { Client } from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
import type { Capabilities, Delegation } from "@web3-storage/w3up-client/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStorachaContext } from "../StorachaProvider";

const requestDelegation = async ({
	did,
	spaceId,
}: {
	did: string;
	spaceId: string;
}) => {
	const delegationArchive = await apiClient.auth.requestDelegation({
		spaceId: spaceId,
		did,
	});

	const delegation = await extract(new Uint8Array(delegationArchive));
	console.log("request delegation", did, "space:", spaceId);
	console.log(delegation.ok);
	if (!delegation.ok) {
		throw new Error("Failed to extract delegation");
	}

	return delegation;
};

interface StorachaUpload {
	root: string; // CID of the upload
	shards?: string[]; // Array of shard CIDs
	inserted: string; // ISO timestamp
	updated: string; // ISO timestamp
}

export const useDelegateAccount = (options: {
	client: Client | null;
	spaceDid: string;
}) => {
	const { client, spaceDid } = options;

	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(
		null,
	);

	const isDelegationRequestInProgress = useRef(false);

	/**
	 * Delegate to client/agent, not the account did
	 */

	useEffect(() => {
		(async () => {
			if (!client || !spaceDid) {
				return;
			}

			const did = client.did();

			if (!did) {
				return;
			}

			if (delegation || isDelegationRequestInProgress.current) {
				return;
			}

			isDelegationRequestInProgress.current = true;

			try {
				const delegationResults = await requestDelegation({
					spaceId: spaceDid,
					did,
				});

				// TODO request only if expired
				setDelegation(delegationResults.ok);

				const space = await client.addSpace(delegationResults.ok);
				await client.setCurrentSpace(space.did());
			} finally {
				isDelegationRequestInProgress.current = false;
			}
		})();
	}, [client, spaceDid, delegation]);

	return {
		client,
		delegation,
	};
};

// https://github.com/storacha/w3ui/blob/main/examples/react/uploads-list/src/App.tsx#L27
// Client with delegation setup
export const useSpaceFiles = (options: {
	client: Client | null;
	isEnabled?: boolean;
}) => {
	const { client, isEnabled = true } = options;

	const [isLoading, setIsLoading] = useState(false);
	const [files, setFiles] = useState<StorachaUpload[]>([]);
	const [error, setError] = useState<string | null>(null);

	const { client: storachaClient, delegation } = useStorachaContext();

	const loadFiles = useCallback(async () => {
		if (!storachaClient || !delegation) {
			return;
		}

		console.log(
			"load files client ready",
			delegation?.audience.did(),
			storachaClient.did(),
		);
		const currentSpace = await storachaClient.currentSpace();
		await storachaClient.addSpace(delegation);
		await storachaClient.addProof(delegation);

		console.log("loading files from space", currentSpace?.did());
		console.log("by ", storachaClient.did());

		return await storachaClient.capability.upload
			.list({
				cursor: "",
				// cursor: searchParams.cursor,
				pre: true,
				// pre: searchParams.pre === 'true',
				size: 10,
			})
			.catch((error) => {
				console.error("error loading files", error.cause);
			});
	}, [storachaClient, delegation]);

	return {
		files,
		isLoading,
		error,
		loadFiles,
	};
};
