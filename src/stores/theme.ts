import { atom } from "nanostores";

type Theme = "dark" | "light" | "system";

const storageKey = "vite-ui-theme";

const initialTheme = typeof window !== "undefined" 
  ? (localStorage.getItem(storageKey) as Theme) || "system"
  : "system";

export const themeStore = atom<Theme>(initialTheme);

export function setTheme(theme: Theme) {
  console.log("Setting theme to:", theme);
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey, theme);
    themeStore.set(theme);
  }
}

// Subscribe to theme changes to update the DOM
if (typeof window !== "undefined") {
  themeStore.subscribe((theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      console.log("Applied system theme:", systemTheme);
      return;
    }

    root.classList.add(theme);
    console.log("Applied theme:", theme);
  });
} 