import { authWithEmail } from "@geist-filecoin/storage";
import { useStore } from "@livestore/react";
import type { DidMailto, EmailAddress } from "@web3-storage/w3up-client/types";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ReactNode } from "react";
import { firstSpace$, useUiState } from "../../livestore/queries";
import { useStorachaContext } from "./StorachaProvider";
import { useLiveStore } from "./hooks/useLiveStore";
import * as Proof from "@web3-storage/w3up-client/proof";

// Auth context types
interface AuthUser {
	did: string;
	delegation: ArrayBuffer;
	ucanAccountProofs: string[] | null;
}

export enum LoginState {
	Idle = "idle",
	Loading = "loading",
	// pending email sent
	Pending = "pending",
	Success = "success",
	Error = "error",
}

interface LoginStatus {
	state: LoginState;
	error?: string;
}

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	error: string | null;
	// Login status and functions
	loginStatus: LoginStatus;
	login: (email: string) => Promise<void>;
	resetLoginStatus: () => void;
}

function b64EncodeUnicode(bytes: Uint8Array) {

	// Convert the Uint8Array to a "binary string"
	const binaryString = String.fromCharCode(...bytes);

	// Base64 encode the binary string
	return btoa(binaryString);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
	const { store } = useStore();
	const {
		client,
		agentDid: clientId,
		initializeClient,
		setClient,
		setAgentDid,
	} = useStorachaContext();

	const [user, setUser] = useState<AuthUser | null>(null);

	// TODO consolidate user inside livestore state

	const [uiState, setUiState] = useUiState();

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Login status
	const [loginStatus, setLoginStatus] = useState<LoginStatus>({
		state: LoginState.Idle,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		console.log('AuthProvider useEffect', uiState);
		setUiState({
			// ...uiState,
			currentUserDid: "did:demo",
		});
		if (client) {
			(async () => {
				const accounts = client.accounts();
				console.log(`Auth init, look for  existing account: ${uiState?.currentUserDid}`);
				const existingAccount = (accounts as any)[uiState?.currentUserDid];


				if (existingAccount) {

					const ucanAccountProofsArchived = await Promise.all(existingAccount.proofs.map(async p => {
						const archive = await p.archive()
						return b64EncodeUnicode(archive.ok)
					}));

					const testing = await Promise.all(ucanAccountProofsArchived.map(p => Proof.parse(p)));

					console.log('ucanAccountProofsArchived', ucanAccountProofsArchived.join(","))
					console.log('testing', testing)
					const ucanAccountProofs = existingAccount.proofs.map((proof: any) => proof.toJSON())
					// ?.find((proof: any) => proof.att?.[0]?.with === 'did:web:up.storacha.network');
					console.log('ucanAccountProof find', ucanAccountProofs);
					if (ucanAccountProofs) {
						setUser({
							did: existingAccount.did(),
							delegation: new ArrayBuffer(0),
							// more decoupled
							ucanAccountProofs

						});

					}
				}
			})();
		}
	}, [client, uiState?.currentUserDid]);

	// Login function
	const login = async (email: string) => {
		try {
			setLoginStatus({ state: LoginState.Loading });

			// Initialize client if not already initialized
			setLoginStatus({ state: LoginState.Pending });
			const account = await authWithEmail(client, email as EmailAddress);

			if (!account) {
				return;
			}
			// while it's possible for storacha client to connect to multiple accounts
			// currently we use the email login did

			const user = {
				did: account?.model?.id,
				delegation: new ArrayBuffer(0),
				ucanAccountProofs: []
				// ucanAccountProof: account?.proofs?.[0]?.token,
			};

			console.log("Login success with account", user);

			// TODO merge user and ui state
			setUser(user);

			setUiState({
				// ...uiState,
				currentUserDid: user.did,
			});
			setClient(client);

			console.log("set agent did", account?.model?.id, client?.did(), account?.agent?.did());
			setAgentDid(account?.model?.id);

			setLoginStatus({ state: LoginState.Success });
		} catch (error) {
			console.error("Login failed:", error);

			setUser(null);
			setLoginStatus({
				state: LoginState.Error,
				error: error instanceof Error ? error.message : "Login failed",
			});
		}
	};

	// Reset login status
	const resetLoginStatus = () => {
		setLoginStatus({ state: LoginState.Idle });
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		error,
		loginStatus,
		login,
		resetLoginStatus,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

// HOC to wrap components with auth
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
	return function AuthenticatedComponent(props: P) {
		return (
			<AuthProvider>
				<Component {...props} />
			</AuthProvider>
		);
	};
}
