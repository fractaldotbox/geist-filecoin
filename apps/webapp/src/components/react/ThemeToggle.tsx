import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/react/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/react/ui/dropdown-menu";
import { useThemeStore } from "@/stores/theme";

export function ThemeToggle() {
	const { theme, setTheme } = useThemeStore();

	const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
		console.log("Theme toggle clicked:", newTheme);
		setTheme(newTheme);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => handleThemeChange("light")}
					className={theme === "light" ? "bg-accent" : ""}
				>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleThemeChange("dark")}
					className={theme === "dark" ? "bg-accent" : ""}
				>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => handleThemeChange("system")}
					className={theme === "system" ? "bg-accent" : ""}
				>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
