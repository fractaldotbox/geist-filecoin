import { getShortForm, truncate } from "@/lib/utils/string";
import { Copy, User } from "lucide-react";
import { useStorachaContext } from "./StorachaProvider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function AccountMenu() {
	const { clientId } = useStorachaContext();

	// Copy DID to clipboard
	const copyDid = async () => {
		if (clientId) {
			try {
				await navigator.clipboard.writeText(clientId);
			} catch (error) {
				console.error("Failed to copy DID:", error);
			}
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src="" alt="User avatar" />
						<AvatarFallback className="text-xs">
							<User className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="font-mono text-xs flex items-center justify-between cursor-pointer"
					onClick={copyDid}
				>
					<span>{clientId ? getShortForm(clientId, 10) : "Not connected"}</span>
					{clientId && <Copy className="h-3 w-3 text-muted-foreground" />}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{/* <DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuItem>Sign out</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
