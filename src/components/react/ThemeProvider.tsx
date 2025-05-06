import { createPersistedStore } from "@/lib/persistedStore";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

const storageKey = "vite-ui-theme";

// Define the store using our persisted store utility
export const themeStore = createPersistedStore<Theme>(storageKey, "system");

export function setTheme(theme: Theme) {
	themeStore.set(theme);
}

export function ThemeProvider() {
	const theme = useStore(themeStore);
	const [mounted, setMounted] = useState(false);

	// Only execute client-side code after mounting
	useEffect(() => {
		setMounted(true);
	}, []);

	// Skip all effects during SSR
	if (!mounted) {
		return null;
	}

	// Apply theme to document - only runs client-side
	useEffect(() => {
		if (!mounted) return;

		// Safe to access window/document here since we've checked mounted
		const root = document.documentElement;
		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme, mounted]);

	// Listen for system theme changes - only runs client-side
	useEffect(() => {
		if (!mounted) return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme === "system") {
				const root = document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(mediaQuery.matches ? "dark" : "light");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme, mounted]);

	// Return null since we don't need to render anything
	return null;
}
