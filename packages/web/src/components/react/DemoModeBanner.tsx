import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export function DemoModeBanner() {
	return (
		<Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
			<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
			<AlertDescription className="text-amber-800 dark:text-amber-300 flex items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<strong>Demo Mode Active</strong>
					<span>•</span>
					<span>Sample data has been loaded automatically</span>
				</div>
			</AlertDescription>
		</Alert>
	);
}
