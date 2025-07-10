import { useStore } from "@livestore/react";
import { type Capabilities, type Delegation, Provider } from "@w3ui/react";
import * as Client from "@web3-storage/w3up-client";
import { StoreIndexedDB } from "@web3-storage/w3up-client/stores/indexeddb";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { firstSpace$ } from "../../livestore/queries";
import { useLiveStore } from "./hooks/useLiveStore";
import { useDelegateAccount } from "./hooks/useStoracha";

interface StorachaContextValue {
	agentDid: string | null;
	client: Client.Client | null;
	setClient: (client: Client.Client | null) => void;
	setAgentDid: (clientId: string | null) => void;
	delegation: Delegation<Capabilities> | null;
	initializeClient: () => Promise<Client.Client>;
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
	const [agentDid, setAgentDid] = useState<string | null>(null);
	const [client, setClient] = useState<Client.Client | null>(null);
	const [delegation, setDelegation] = useState<Delegation<Capabilities> | null>(
		null,
	);

	const { createStorachaStorageAuthorization } = useLiveStore();
	const activeSpace = store.useQuery(firstSpace$);
	const delegationCommittedRef = useRef<string | null>(null);

	// Initialize client after user authentication
	const initializeClient = async (): Promise<Client.Client> => {
		try {
			const storachaStore = new StoreIndexedDB("storacha-client");
			const storachaClient = await Client.create({ store: storachaStore });

			console.log("init client accounts", storachaClient.accounts());

			setClient(storachaClient);
			// TODO use default did for read only use cases
			// setAgentDid(storachaClient.did());

			return storachaClient;
		} catch (error) {
			console.error("Failed to initialize Storacha client:", error);
			throw error;
		}
	};

	const { delegation: delegationResults } = useDelegateAccount({
		client,
		agentDid,
		spaceDid: activeSpace?.storageProviderId || "",
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!client) {
			(async () => {
				const initializedClient = await initializeClient();
				setClient(initializedClient);
			})();
		}
	}, []);

	useEffect(() => {
		console.log("active space", activeSpace);

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
	}, [delegationResults, activeSpace, createStorachaStorageAuthorization]);

	const contextValue: StorachaContextValue = {
		agentDid,
		client,
		setClient,
		setAgentDid,
		delegation,
		initializeClient,
	};

	return (
		<StorachaContext.Provider value={contextValue}>
			<Provider>{children}</Provider>
		</StorachaContext.Provider>
	);
};
