import * as Client from "@web3-storage/w3up-client";
import { extract } from "@web3-storage/w3up-client/delegation";
import type { Capabilities, Delegation } from "@web3-storage/w3up-client/types";
import ky from "ky";
import { useEffect, useState } from "react";

const requestDelegation = async ({
	did,
}: {
	did: string;
}) => {
	const authRes = await ky
		.post("http://localhost:8787/api/auth", {
			json: {
				did,
			},
		})
		.arrayBuffer();

	const delegation = await extract(new Uint8Array(authRes));
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
			console.log('request delegate for space', activeSpace);
			const did = client.did();
			console.log("did", did);

			// TODO request only if expired

			const delegation = await requestDelegation({ did });

			console.log(
				"requested delegation to",
				did,
				delegation.ok.root.cid.toString(),
			);
			setDelegation(delegation.ok);

			const space = await client.addSpace(delegation.ok);
			await client.setCurrentSpace(space.did());
		})();
	}, [client, activeSpace]);

	return {
		delegation,
	};
};
