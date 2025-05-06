import { atom } from "nanostores";

type Theme = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "vite-ui-theme";

const initialTheme =
	typeof window !== "undefined"
		? (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system"
		: "system";

export const themeStore = atom<Theme>(initialTheme);

export function setTheme(theme: Theme) {
	if (typeof window !== "undefined") {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
		themeStore.set(theme);

		theme === "dark"
			? document.documentElement.classList.add("dark")
			: document.documentElement.classList.remove("dark");
	}
}
