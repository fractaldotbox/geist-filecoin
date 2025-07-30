import { useStore } from "@livestore/react";
import * as Client from "@storacha/client";
import { StoreIndexedDB } from "@storacha/client/stores/indexeddb";
import { type Capabilities, type Delegation, Provider } from "@w3ui/react";
import {
	createContext,
	type ReactNode,
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

function b64EncodeUnicode(bytes: Uint8Array) {
	// Convert the Uint8Array to a "binary string"
	const binaryString = String.fromCharCode(...bytes);

	// Base64 encode the binary string
	return btoa(binaryString);
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
		// Commit StorachaStorageAuthorized event when delegation becomes available
		if (
			delegationResults &&
			activeSpace &&
			delegationCommittedRef.current !== delegationResults.root.cid.toString()
		) {
			(async () => {
				const archive = await delegationResults.archive();
				console.log("archive", archive);

				if (!archive?.ok) {
					return;
				}
				const authId = crypto.randomUUID();

				createStorachaStorageAuthorization({
					id: authId,
					spaceId: activeSpace.id,
					delegationCid: delegationResults.root.cid.toString(),
					delegationData: b64EncodeUnicode(archive.ok),

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
			})();
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
