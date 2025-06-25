import { useW3 } from "@w3ui/react";
import { extract } from "@web3-storage/w3up-client/delegation";
import type {
	Capabilities,
	Delegation,
} from "@web3-storage/w3up-client/types";
import { useEffect, useState } from "react";

const requestDelegation = ({
	did,
}: {
	did: string;
}) => {
	const search = new URLSearchParams({
		did,
	});

	return fetch(`/httpcat/api/auth?${search.toString()}`)
		.then((response) => response.arrayBuffer())
		.then(async (arrayBuffer) => {
			const delegation = await extract(new Uint8Array(arrayBuffer));
			console.log(delegation.ok);
			if (!delegation.ok) {
				throw new Error("Failed to extract delegation", {
					cause: delegation.error,
				});
			}

			return delegation;
		});
};

export const useDelegateAccount = () => {
	const [{ client, accounts }] = useW3();

	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(
		null,
	);

	/**
	 * Delegate to client/agent, not the account did
	 */

	useEffect(() => {
		(async () => {
			if (!client) {
				return;
			}
			const did = client.did();

			const delegation = await requestDelegation({ did });

			console.log(`delegation to ${did}`, delegation.ok.root.cid.toString());
			const space = await client.addSpace(delegation.ok);
			console.log("set space", space.name, space.did());
			await client.setCurrentSpace(space.did());

			setDelegation(delegation.ok);
		})();
	}, [client]);

	return {
		delegation,
	};
}; 