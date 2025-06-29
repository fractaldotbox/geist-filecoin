import { useStore } from "@livestore/react";
import { Capabilities, Delegation, Provider } from "@w3ui/react";
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { firstSpace$ } from "../../livestore/queries.js";
import { useLiveStore } from "./hooks/useLiveStore.js";
import { useDelegateAccount } from "./hooks/useStoracha.js";

export { useDelegateAccount } from "./hooks/useStoracha.js";

interface StorachaContextValue {
	clientId: string | null;
	client: Client.Client | null;
	setClient: (client: Client.Client | null) => void;
	delegation: Delegation<Capabilities> | null;
}

const StorachaContext = createContext<StorachaContextValue | undefined>(
	undefined,
);

export const useStorachaContext = () => {
	const context = useContext(StorachaContext);
	if (context === undefined) {
		throw new Error(
			"useStorachaContext must be used within a StorachaProvider",
		);
	}
	return context;
};

export const useStorachaClient = () => {
	const { client } = useStorachaContext();
	return client;
};

export const useSetStorachaClient = () => {
	const { setClient } = useStorachaContext();
	return setClient;
};

interface StorachaProviderProps {
	children: ReactNode;
}

export const StorachaProvider: React.FC<StorachaProviderProps> = ({
	children,
}) => {
	const { store } = useStore();
	const [clientId, setClientId] = useState<string | null>(null);
	const [client, setClient] = useState<Client.Client | null>(null);
	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(null);
	const { createStorachaStorageAuthorization } = useLiveStore();
	const activeSpace = store.useQuery(firstSpace$);
	const delegationCommittedRef = useRef<string | null>(null);

	// Only request delegation if there's an active space with Storacha provider

	useEffect(() => {
		const initializeStorachaClient = async () => {
			try {
				const storachaStore = new StoreMemory();
				const storachaClient = await Client.create({ store: storachaStore });

				// Update state with the client instance and DID
				setClient(storachaClient);
				setClientId(storachaClient.did());
			} catch (error) {
				console.error("Failed to initialize Storacha client:", error);
			}
		};

		initializeStorachaClient();
	}, []);

	const { delegation: delegationResults } = useDelegateAccount({
		client,
		spaceDid: activeSpace?.storageProviderId || "",
	});

	useEffect(() => {
		console.log("active space", activeSpace);
		console.log("client ID", clientId);

		// Commit StorachaStorageAuthorized event when delegation becomes available
		if (
			delegationResults &&
			activeSpace &&
			delegationCommittedRef.current !== delegationResults.root.cid.toString()
		) {
			const authId = crypto.randomUUID();

			createStorachaStorageAuthorization({
				id: authId,
				spaceId: activeSpace.id,
				delegationCid: delegationResults.root.cid.toString(),
				// TODO consider store the original CAR array buffer
				delegationData: JSON.stringify(delegationResults.toJSON()),
				clientDid: delegationResults.audience.did(),
				isActive: true,
				authorizedAt: new Date(),
				expiresAt: delegationResults.expiration
					? new Date(delegationResults.expiration * 1000)
					: undefined,
			});

			setDelegation(delegationResults);

			// Mark this delegation as committed to avoid duplicate events
			delegationCommittedRef.current = delegationResults.root.cid.toString();
		}
	}, [delegationResults, activeSpace, createStorachaStorageAuthorization, clientId]);

	const contextValue: StorachaContextValue = {
		clientId,
		client,
		setClient,
		delegation,
	};

	return (
		<StorachaContext.Provider value={contextValue}>
			<Provider>{children}</Provider>
		</StorachaContext.Provider>
	);
};
