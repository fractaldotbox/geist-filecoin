import {
	GlobalProgress,
	ProgressProvider,
} from "@/components/react/ui/global-progress";

export function GlobalProgressProvider() {
	return (
		<ProgressProvider>
			<GlobalProgress />
		</ProgressProvider>
	);
}
