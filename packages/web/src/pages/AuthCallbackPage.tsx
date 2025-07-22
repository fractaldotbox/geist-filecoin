import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/react/AuthProvider";
import { handleBlueskyCallback } from "../lib/bluesky-oauth";

export function AuthCallbackPage() {
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { setBlueskySession } = useAuth();

	const [params] = useSearchParams();

	const isHandlingCallbackRef = useRef(false);

	useEffect(() => {
		if (isHandlingCallbackRef.current) return;
		isHandlingCallbackRef.current = true;

		const isMounted = true;
		const processCallback = async () => {
			console.log("processCallback", params);
			try {
				const authResult = await handleBlueskyCallback(params);

				if (authResult && isMounted) {
					// Update auth context with Bluesky session
					setBlueskySession(authResult);
				}

				if (isMounted) setIsProcessing(false);
			} catch (error) {
				console.error("Auth callback error:", error);
				if (isMounted) {
					setError(
						error instanceof Error ? error.message : "Authentication failed",
					);
					setIsProcessing(false);
				}
			}
		};

		processCallback();
	}, [setBlueskySession, params]);

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
