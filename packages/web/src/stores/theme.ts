import { useState, useEffect } from 'react'

type Theme = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "vite-ui-theme";

const initialTheme =
	typeof window !== "undefined"
		? (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system"
		: "system";

// Hook to get and set theme using localStorage
export function useTheme() {
	const [theme, setThemeState] = useState<Theme>(initialTheme)
	
	useEffect(() => {
		const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme
		if (storedTheme && storedTheme !== theme) {
			setThemeState(storedTheme)
		}
	}, [theme])
	
	const setTheme = (newTheme: Theme) => {
		if (typeof window !== "undefined") {
			localStorage.setItem(THEME_STORAGE_KEY, newTheme);
			setThemeState(newTheme);

			newTheme === "dark"
				? document.documentElement.classList.add("dark")
				: document.documentElement.classList.remove("dark");
		}
	}
	
	return { theme, setTheme }
}

// Legacy compatibility - export a hook that mimics the old themeStore behavior
export function useThemeStore() {
	return useTheme()
}
