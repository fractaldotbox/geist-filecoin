import { useStore } from "@livestore/react";
import { Provider } from "@w3ui/react";
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
import { firstActiveSpace$ } from "../../livestore/queries.js";
import { useLiveStore } from "./hooks/useLiveStore.js";
import { useDelegateAccount } from "./hooks/useStoracha.js";

export { useDelegateAccount } from "./hooks/useStoracha.js";

interface StorachaContextValue {
	clientId: string | null;
	client: Client.Client | null;
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

interface StorachaProviderProps {
	children: ReactNode;
}

export const StorachaProvider: React.FC<StorachaProviderProps> = ({
	children,
}) => {
	const { store } = useStore();
	const [clientId, setClientId] = useState<string | null>(null);
	const [client, setClient] = useState<Client.Client | null>(null);

	const { createStorachaStorageAuthorization } = useLiveStore();
	const activeSpace = store.useQuery(firstActiveSpace$);
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

	const { delegation } = useDelegateAccount({
		spaceDid: activeSpace?.spaceProof || "",
		activeSpace,
	});

	useEffect(() => {
		console.log("delegation", delegation);
		console.log("active space", activeSpace);
		console.log("client ID", clientId);

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
				// TODO consider store the original CAR array buffer
				delegationData: JSON.stringify(delegation.toJSON()),
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
	}, [delegation, activeSpace, createStorachaStorageAuthorization, clientId]);

	const contextValue: StorachaContextValue = {
		clientId,
		client,
	};

	return (
		<StorachaContext.Provider value={contextValue}>
			<Provider>{children}</Provider>
		</StorachaContext.Provider>
	);
};
