import { Progress } from "@/components/react/ui/progress";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

// Progress context
interface ProgressContextType {
	isVisible: boolean;
	value: number;
	showProgress: () => void;
	updateProgress: (value: number) => void;
	hideProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(
	undefined,
);

// Progress provider component
export function ProgressProvider({ children }: { children: ReactNode }) {
	const [isVisible, setIsVisible] = useState(false);
	const [value, setValue] = useState(0);

	const showProgress = () => {
		setIsVisible(true);
		setValue(0);
	};

	const updateProgress = (newValue: number) => {
		setIsVisible(true);
		setValue(newValue);
	};

	const hideProgress = () => {
		setIsVisible(false);
		setValue(0);
	};

	return (
		<ProgressContext.Provider
			value={{
				isVisible,
				value,
				showProgress,
				updateProgress,
				hideProgress,
			}}
		>
			{children}
		</ProgressContext.Provider>
	);
}

// Hook to use progress context
export function useProgress() {
	const context = useContext(ProgressContext);
	if (context === undefined) {
		throw new Error("useProgress must be used within a ProgressProvider");
	}
	return context;
}

// Helper functions to control the progress (for backward compatibility)
export function showProgress(): void {
	// This will be called from outside the context, so we'll use a global state
	// For now, we'll use a simple approach with a custom event
	window.dispatchEvent(new CustomEvent("showProgress"));
}

export function updateProgress(value: number): void {
	window.dispatchEvent(
		new CustomEvent("updateProgress", { detail: { value } }),
	);
}

export function hideProgress(): void {
	window.dispatchEvent(new CustomEvent("hideProgress"));
}

// Simulate progress for demo purposes
export async function simulateProgress(): Promise<void> {
	showProgress();
	return new Promise<void>((resolve) => {
		let progress = 0;
		const interval = setInterval(() => {
			progress += 5;
			updateProgress(progress);

			if (progress >= 100) {
				clearInterval(interval);
				setTimeout(() => {
					hideProgress();
					resolve();
				}, 500); // Wait a bit at 100% for visual effect
			}
		}, 100);
	});
}

export function GlobalProgress() {
	const {
		isVisible,
		value,
		showProgress: show,
		updateProgress: update,
		hideProgress: hide,
	} = useProgress();

	useEffect(() => {
		// Listen for global progress events
		const handleShow = () => show();
		const handleUpdate = (event: CustomEvent) => update(event.detail.value);
		const handleHide = () => hide();

		window.addEventListener("showProgress", handleShow);
		window.addEventListener("updateProgress", handleUpdate as EventListener);
		window.addEventListener("hideProgress", handleHide);

		// Cleanup function
		return () => {
			window.removeEventListener("showProgress", handleShow);
			window.removeEventListener(
				"updateProgress",
				handleUpdate as EventListener,
			);
			window.removeEventListener("hideProgress", handleHide);
			hide();
		};
	}, [show, update, hide]);

	if (!isVisible) return null;

	return (
		<div className="fixed top-0 left-0 right-0 z-50 h-1">
			<div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20" />
			<Progress
				value={value}
				className="h-1 rounded-none"
				style={{
					background: "transparent",
					backgroundImage: "linear-gradient(to right, #3b82f6, #06b6d4)",
					backgroundSize: `${value}% 100%`,
					backgroundRepeat: "no-repeat",
					transition: "background-size 0.3s ease-in-out",
				}}
			/>
		</div>
	);
}
