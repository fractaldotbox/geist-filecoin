import { useUiState } from "@/livestore/queries";
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { LoginState, useAuth } from "../components/react/AuthProvider";
import { blueskyOAuth, mapBlueskySessionAsUser } from "../lib/bluesky-oauth";

export function AuthCallbackPage() {
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { onUserLoginSuccess, setLoginStatus } = useAuth();

	const [uiState, setUiState] = useUiState();
	const [params] = useSearchParams();

	const isHandlingCallbackRef = useRef(false);

	useEffect(() => {
		if (isHandlingCallbackRef.current) return;
		isHandlingCallbackRef.current = true;

		const processCallback = async () => {
			setLoginStatus(LoginState.Loading);

			// queyr params encoded after # and not available as URLSearchParams
			try {
				const session = await blueskyOAuth.getCurrentSession();
				if (session) {
					onUserLoginSuccess(mapBlueskySessionAsUser(session));
				}
			} catch (error) {
				console.error("Auth callback error:", error);
				setError(
					error instanceof Error ? error.message : "Authentication failed",
				);
			} finally {
				setIsProcessing(false);
			}
		};

		processCallback();
	}, [onUserLoginSuccess, setLoginStatus]);

	if (isProcessing) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
					<p>Completing authentication...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-red-600 mb-4">Authentication failed: {error}</p>
					<a href="/" className="text-primary hover:underline">
						Return to home
					</a>
				</div>
			</div>
		);
	}

	// Redirect to home page after successful authentication
	return <Navigate to="/" replace />;
}
