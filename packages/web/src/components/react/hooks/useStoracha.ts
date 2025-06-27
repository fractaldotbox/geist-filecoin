import apiClient, { auth } from "@/lib/api-client";
import * as Client from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
import type { Capabilities, Delegation } from "@web3-storage/w3up-client/types";
import { useEffect, useRef, useState } from "react";

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
	console.log(delegation.ok);
	if (!delegation.ok) {
		throw new Error("Failed to extract delegation");
	}

	return delegation;
};

export const useDelegateAccount = (options: {
	spaceDid: string;
	activeSpace?: any;
}) => {
	const { spaceDid, activeSpace } = options;

	const [client, setClient] = useState<any>(null);

	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(
		null,
	);

	const isDelegationRequestInProgress = useRef(false);

	useEffect(() => {
		if (client || !activeSpace) {
			return;
		}

		(async () => {
			const client = await Client.create();
			console.log("client", client);
			setClient(client);
		})();
	}, [client, activeSpace]);
	/**
	 * Delegate to client/agent, not the account did
	 */

	useEffect(() => {
		(async () => {
			if (!client || !activeSpace) {
				return;
			}

			const did = client.did();

			if (!did) {
				return;
			}

			if (delegation || isDelegationRequestInProgress.current) {
				console.log("delegation already exists or request in progress");
				return;
			}

			isDelegationRequestInProgress.current = true;

			try {
				const delegationResults = await requestDelegation({
					spaceId: activeSpace?.id || "",
					did,
				});

				// TODO request only if expired

				console.log(
					"requested delegation to",
					did,
					delegationResults.ok.root.cid.toString(),
				);
				setDelegation(delegationResults.ok);

				const space = await client.addSpace(delegationResults.ok);
				await client.setCurrentSpace(space.did());
			} finally {
				isDelegationRequestInProgress.current = false;
			}
		})();
	}, [client, activeSpace, delegation]);

	return {
		delegation,
	};
};
