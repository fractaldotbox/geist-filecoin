import apiClient, { auth } from "@/lib/api-client";
import type { Client } from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
import type { Capabilities, Delegation, DID } from "@web3-storage/w3up-client/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStorachaContext } from "../StorachaProvider";
import * as Proof from "@web3-storage/w3up-client/proof";

const requestDelegation = async ({
	agentDid,
	spaceId,
	accountProof,
}: {
	agentDid: DID;
	spaceId: string;
	accountProof: string;
}) => {
	try {
		const delegationArchive = await apiClient.auth.authorizeUcan({
			spaceId: spaceId,
			agentDid,
			accountProof: accountProof,
		});

		if (delegationArchive?.byteLength === 0) {
			return {
				ok: null,
			};
		}

		const delegation = await extract(new Uint8Array(delegationArchive));
		console.log("request delegation", agentDid, "space:", spaceId);
		if (!delegation.ok) {
			throw new Error("Failed to extract delegation");
		}

		return delegation;
	} catch (error) {
		console.error("error requesting delegation", error);
	}

	return {
		ok: null,
	};
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
	agentDid: string | null;
}) => {
	const { client, spaceDid, agentDid } = options;

	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(
		null,
	);

	const isDelegationRequestInProgress = useRef(false);

	/**
	 * Delegate to client/agent, not the account did
	 */

	// TODO delegate after account init complted
	useEffect(() => {
		(async () => {
			console.log("useDelegateAccount ", "client", client?.did(), "agent", agentDid, "space", spaceDid);
			if (!client || !spaceDid || !agentDid) {
				return;
			}

			if (delegation || isDelegationRequestInProgress.current) {
				return;
			}

			const accountProof = client.accounts()?.[0]?.proofs?.[0]?.token;

			isDelegationRequestInProgress.current = true;

			try {
				console.log("request delegation", agentDid, spaceDid);

				// console.log("request with", client.did(), client.accounts()?.[0], spaceDid)
				const delegationResults = await requestDelegation({
					spaceId: spaceDid,
					agentDid: client.did() as DID,
					accountProof,
				});


				if (!delegationResults.ok) {
					throw new Error("Failed to request delegation");
				}

				// TODO request only if expired
				setDelegation(delegationResults.ok);

				client.addProof(delegationResults.ok);
				client.addSpace(delegationResults.ok);

				console.log("create delegation chain");
				const delegation = await client.createDelegation(client.did(), ["upload/list", "upload/add"], {
					expiration:Math.floor(Date.now() / 1000) + 60 * 60 * 24});
				console.log("create delegation success");
			
				const archive = await delegation.archive();
				return archive.ok;


				// const space = await client.addSpace(delegationResults.ok);
				// await client.setCurrentSpace(space.did());
			} finally {
				isDelegationRequestInProgress.current = false;
			}
		})();
	}, [client, spaceDid, agentDid, delegation]);

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


		console.log("load file from space", currentSpace?.did());
		console.log("load file by client did", storachaClient.did());

		console.log("load file accounts", storachaClient.accounts())



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
