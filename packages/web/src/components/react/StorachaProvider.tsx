import { useStore } from "@livestore/react";
import { Provider } from "@w3ui/react";
import { type ReactNode, useEffect, useRef } from "react";
import { firstActiveSpace$ } from "../../livestore/queries.js";
import { useLiveStore } from "./hooks/useLiveStore.js";
import { useDelegateAccount } from "./hooks/useStoracha.js";

export { useDelegateAccount } from "./hooks/useStoracha.js";

interface StorachaProviderProps {
	children: ReactNode;
}

export const StorachaProvider: React.FC<StorachaProviderProps> = ({
	children,
}) => {
	const { store } = useStore();
	const { createStorachaStorageAuthorization } = useLiveStore();
	const activeSpace = store.useQuery(firstActiveSpace$);
	const delegationCommittedRef = useRef<string | null>(null);

	// Only request delegation if there's an active space with Storacha provider

	const { delegation } = useDelegateAccount({
		spaceDid: activeSpace?.spaceProof || "",
		activeSpace,
	});

	useEffect(() => {
		console.log("delegation", delegation);
		console.log("active space", activeSpace);

		// Commit StorachaStorageAuthorized event when delegation becomes available
		if (
			delegation &&
			activeSpace &&
			delegationCommittedRef.current !== delegation.root.cid.toString()
		) {
			const authId = crypto.randomUUID();

			createStorachaStorageAuthorization({
				id: authId,
				spaceId: activeSpace.id,
				delegationCid: delegation.root.cid.toString(),
				clientDid: delegation.audience.did(),
				isActive: true,
				authorizedAt: new Date(),
				expiresAt: delegation.expiration
					? new Date(delegation.expiration * 1000)
					: undefined,
			});

			// Mark this delegation as committed to avoid duplicate events
			delegationCommittedRef.current = delegation.root.cid.toString();
		}
	}, [delegation, activeSpace, createStorachaStorageAuthorization]);

	return <Provider>{children}</Provider>;
};
