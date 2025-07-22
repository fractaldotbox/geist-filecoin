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
import {
	loginWithBluesky as blueskyLogin,
	blueskyOAuth,
	clearBlueskySession,
	mapBlueskySessionAsUser,
	refreshBlueskyToken,
} from "../../lib/bluesky-oauth";
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
	loginStatus: LoginStatus;
	login: (email: string) => Promise<void>;
	onUserLoginSuccess: (user: AuthUser) => void;
	logout: () => void;
	setLoginStatus: (state: LoginState) => void;
	loginWithBluesky: (handle?: string) => Promise<void>;
	clearBlueskyAuth: () => void;
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

	const [loginStatus, setLoginStatus] = useState<LoginStatus>({
		state: LoginState.Idle,
	});

	const onUserLoginSuccess = useCallback(
		(user: AuthUser) => {
			console.log("Login success with account", user);

			localStorage.setItem(DID_LOCALSTORAGE_KEY, user.did);

			setUiState({
				...uiState,
				currentUserDid: user.did,
			});
			setClient(client);

			setLoginStatus({ state: LoginState.Success });
		},
		[uiState, setUiState, setClient, client],
	);

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

	// Currently for Bluesky only

	useEffect(() => {
		const checkAndRefreshSession = async () => {
			// During logout, avoid re-login right away

			if (loginStatus.state === LoginState.Idle) {
				return;
			}

			const existingSession = await blueskyOAuth.getCurrentSession();
			if (existingSession && !uiState.currentUserDid) {
				const user = mapBlueskySessionAsUser(existingSession);
				onUserLoginSuccess(user);
				localStorage.setItem("geist.user.handle", user.did);
			}

			// Try to refresh token if we have a session
			if (existingSession) {
				try {
					await refreshBlueskyToken();
				} catch (error) {
					console.error("Failed to refresh Bluesky token:", error);
					// If refresh fails, clear the session
					clearBlueskyAuth();
				}
			}
		};

		checkAndRefreshSession();

		// Set up periodic token refresh (every 30 minutes)
		const refreshInterval = setInterval(
			async () => {
				const session = await blueskyOAuth.getCurrentSession();
				if (session) {
					refreshBlueskyToken().catch((error) => {
						console.error("Failed to refresh Bluesky token:", error);
						clearBlueskyAuth();
					});
				}
			},
			30 * 60 * 1000,
		); // 30 minutes

		return () => clearInterval(refreshInterval);
	}, [onUserLoginSuccess, uiState.currentUserDid, loginStatus.state]);

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

			const user = {
				did: account?.model?.id,
				delegation: new ArrayBuffer(0),
			};

			onUserLoginSuccess(user);
			// while it's possible for storacha client to connect to multiple accounts
			// currently we use the email login did
		} catch (error) {
			console.error("Login failed:", error);
			setLoginStatus({
				state: LoginState.Error,
				error: error instanceof Error ? error.message : "Login failed",
			});
		}
	};

	// Bluesky OAuth login function
	const loginWithBluesky = async (handle?: string) => {
		try {
			setLoginStatus({ state: LoginState.Loading });
			await blueskyLogin(handle);
		} catch (error) {
			console.error("Bluesky login failed:", error);
			setLoginStatus({
				state: LoginState.Error,
				error: error instanceof Error ? error.message : "Bluesky login failed",
			});
		}
	};

	// Clear Bluesky authentication
	const clearBlueskyAuth = () => {
		clearBlueskySession();
		localStorage.removeItem(DID_LOCALSTORAGE_KEY);
		localStorage.removeItem("geist.user.handle");

		setUiState({
			...uiState,
			currentUserDid: "",
		});
	};

	// Reset login status
	const resetLoginStatus = () => {
		setLoginStatus({ state: LoginState.Idle });
	};

	// Logout function that clears all auth state
	const logout = () => {
		clearBlueskyAuth();
		// Also clear any Storacha auth if needed
		localStorage.removeItem(DID_LOCALSTORAGE_KEY);
		setUiState({
			currentUserDid: "",
		});
		console.log("logout", uiState);
		setLoginStatus({ state: LoginState.Idle });
	};

	const value: AuthContextType = {
		user: uiState.currentUserDid
			? {
					did: uiState.currentUserDid,
					delegation: new ArrayBuffer(0),
				}
			: null,
		isLoading,
		isAuthenticated: !!uiState.currentUserDid,
		error,
		loginStatus,
		onUserLoginSuccess,
		login,
		loginWithBluesky,
		logout,
		clearBlueskyAuth,
		setLoginStatus,
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
