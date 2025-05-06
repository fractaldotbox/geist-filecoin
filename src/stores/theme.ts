import { atom } from "nanostores";

type Theme = "dark" | "light" | "system";

const storageKey = "vite-ui-theme";

const initialTheme =
	typeof window !== "undefined"
		? (localStorage.getItem(storageKey) as Theme) || "system"
		: "system";

export const themeStore = atom<Theme>(initialTheme);

export function setTheme(theme: Theme) {
	if (typeof window !== "undefined") {
		localStorage.setItem(storageKey, theme);
		themeStore.set(theme);
	}
}
