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

	// Generate initials from DID for avatar fallback
	const getInitials = (did: string) => {
		// Extract the last part of the DID and take first two characters
		const parts = did.split(":");
		const lastPart = parts[parts.length - 1];
		return lastPart ? lastPart.substring(0, 2).toUpperCase() : "U";
	};

	// Truncate DID for display
	const truncateDid = (did: string) => {
		if (did.length <= 20) return did;
		return `${did.substring(0, 10)}...${did.substring(did.length - 8)}`;
	};

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
							{clientId ? getInitials(clientId) : <User className="h-4 w-4" />}
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
					<span>{clientId ? truncateDid(clientId) : "Not connected"}</span>
					{clientId && <Copy className="h-3 w-3 text-muted-foreground" />}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{/* <DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuItem>Sign out</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
