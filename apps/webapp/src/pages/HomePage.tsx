import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import { allEntries$, allSpaces$, useUiState } from "@/livestore/queries";
import { useStore } from "@livestore/react";
import { AlertCircle, Folder } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSpacesDrawer } from "../components/react/SpacesDrawerProvider";

export default function HomePage() {
	const { store } = useStore();
	const navigate = useNavigate();
	const { openSpacesDrawer } = useSpacesDrawer();

	const spaces = store.useQuery(allSpaces$);
	const entries = store.useQuery(allEntries$);
	const [uiState, setUiState] = useUiState();
	const hasSpaces = spaces.length > 0;
	const currentSpaceId = uiState?.currentSpaceId;

	// Redirect to content-types page if currentSpaceId is not null
	useEffect(() => {
		if (currentSpaceId) {
			navigate(`/space/${currentSpaceId}/entries`);
		}
	}, [currentSpaceId, navigate]);

	return (
		<div>
			<div id="container">
				<main className="p-6 m-auto">
					<section className="mt-2">
						{!hasSpaces ? (
							// No spaces - encourage user to create one first
							<Card className="p-8 text-center">
								<div className="flex flex-col items-center">
									<div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
										<AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
									</div>
									<h3 className="text-xl font-semibold mb-2">Get Started</h3>
									<p className="text-muted-foreground mb-6 max-w-md">
										Before you can create content entries, you need to set up a
										content space. Spaces help you organize your content and
										define where it gets stored.
									</p>
									<div className="flex flex-col sm:flex-row gap-4 items-center">
										<Button
											size="lg"
											className="flex items-center gap-2"
											onClick={openSpacesDrawer}
										>
											<Folder className="w-5 h-5" />
											Manage Space
										</Button>
										<p className="text-sm text-muted-foreground">
											Click the "Spaces" button in the navigation above
										</p>
									</div>
								</div>
							</Card>
						) : (
							<div>redirecting</div>
						)}
					</section>
				</main>
			</div>
		</div>
	);
}
