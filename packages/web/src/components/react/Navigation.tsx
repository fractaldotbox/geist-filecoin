import { useStore } from "@livestore/react";
import { Folder } from "lucide-react";
import { firstActiveSpace$ } from "../../livestore/queries";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";

interface NavigationProps {
	onSpacesClick: () => void;
}

export function Navigation({ onSpacesClick }: NavigationProps) {
	const { store } = useStore();
	const currentSpace = store.useQuery(firstActiveSpace$);

	const displayText = currentSpace?.name ? currentSpace.name : "Spaces";
	const truncatedDisplayText =
		displayText.length > 20
			? `${displayText.substring(0, 17)}...`
			: displayText;

	return (
		<div className="sticky top-0 z-50 bg-background border-b pb-2 mb-2">
			<div className="flex justify-between items-center px-6 py-3">
				<div className="text-2xl font-bold">
					<a href="/">Geist</a>
				</div>
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						onClick={onSpacesClick}
						className="flex items-center gap-2"
						title={
							currentSpace
								? `Current space: ${currentSpace.name}`
								: "Manage spaces"
						}
					>
						<Folder className="w-4 h-4" />
						{currentSpace && (
							<span className="w-2 h-2 bg-green-500 rounded-full" />
						)}
						<span className="max-w-32 truncate">{truncatedDisplayText}</span>
					</Button>
					<ThemeToggle />
				</div>
			</div>
		</div>
	);
}
