import apiClient from "@/lib/api-client";
import { authWithEmail } from "@geist-filecoin/storage";
import { useStore } from "@livestore/react";
import type { EmailAddress } from "@web3-storage/w3up-client/types";
import ky from "ky";
import { set } from "node_modules/@web3-storage/w3up-client/dist/src/capability/plan";
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
			(async () => {
				const account = client.accounts();
				const existingAccount = account[uiState.currentUserDid as EmailAddress];
				if (existingAccount) {
					console.log(
						"existing account",
						uiState.currentUserDid,
						existingAccount,
					);
					setUser({
						did: existingAccount.did(),
						delegation: new ArrayBuffer(0),
					});
					setAgentDid(uiState.currentUserDid);
				}
			})();
		}
	}, [client]);

	// Login function
	const login = async (email: string) => {
		try {
			setLoginStatus({ state: LoginState.Loading });

			// Initialize client if not already initialized
			const storachaClient = client;
			// if (!storachaClient) {
			// 	storachaClient = await initializeClient();
			// }

			setLoginStatus({ state: LoginState.Pending });
			const account = await authWithEmail(
				storachaClient,
				email as EmailAddress,
			);

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

			// TODO merge user and ui state
			setUser(user);

			setUiState({
				...uiState,
				currentUserDid: user.did,
			});
			setClient(storachaClient);
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
