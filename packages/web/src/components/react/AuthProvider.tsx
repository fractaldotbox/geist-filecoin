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

// Auth context types
interface AuthUser {
	did: string;
	delegation: ArrayBuffer;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DID_LOCALSTORAGE_KEY = "geist.user.did";

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
	const { store } = useStore();
	const { client, initializeClient, setClient } = useStorachaContext();

	const [uiState, setUiState] = useUiState();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Login status
	const [loginStatus, setLoginStatus] = useState<LoginStatus>({
		state: LoginState.Idle,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (client) {
			if (uiState.currentUserDid) {
				return;
			}
			(async () => {
				// Check localStorage for existing user DID
				const storedDidFromLocalStorage =
					localStorage.getItem(DID_LOCALSTORAGE_KEY);

				const accounts = client.accounts();

				const existingDid = uiState.currentUserDid || storedDidFromLocalStorage;

				// First, try to recover from localStorage
				if (existingDid) {
					const existingAccount = (accounts as any)[existingDid];
					if (existingAccount) {
						const user = {
							did: existingAccount.did(),
							delegation: new ArrayBuffer(0),
						};
						setUiState({
							...uiState,
							currentUserDid: user.did,
						});
					}
				}

				setIsLoading(false);
			})();
		}
	}, [client]);

	// Login function
	const login = async (email: string) => {
		try {
			setLoginStatus({ state: LoginState.Loading });

			// Check if client is available
			if (!client) {
				throw new Error("Client not initialized");
			}

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
			};

			console.log("Login success with account", user);

			localStorage.setItem(DID_LOCALSTORAGE_KEY, user.did);

			// client?.addProof(account?.model?.proofs?.[0]?.token);

			setUiState({
				...uiState,
				currentUserDid: user.did,
			});
			setClient(client);

			setLoginStatus({ state: LoginState.Success });
		} catch (error) {
			console.error("Login failed:", error);
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
		isLoading,
		isAuthenticated: !!uiState.currentUserDid,
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
