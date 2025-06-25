import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import { useStore } from "@livestore/react";
import { AlertCircle, FilePlus, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { useSpacesDrawer } from "../App";
import { allSpaces$ } from "../livestore/queries";

export default function HomePage() {
	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const hasSpaces = spaces.length > 0;
	const { openSpacesDrawer } = useSpacesDrawer();

	return (
		<div id="container">
			<main className="p-10 m-auto">
				<section id="hero">
					<h1 className="text-4xl font-bold pb-2">Geist</h1>
					<h2>Content Management for decentralized team</h2>
				</section>

				<section className="mt-8">
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
						// Has spaces - show available actions
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
								<div className="flex flex-col items-center text-center">
									<div className="mb-4 text-4xl">
										<FilePlus className="w-10 h-10" />
									</div>
									<h3 className="text-xl font-semibold mb-2">Create Entry</h3>
									<p className="text-gray-600 dark:text-gray-300 mb-4">
										Add new content to your existing types
									</p>
									<Link to="/editor/content-type/select">
										<Button>Create Entry</Button>
									</Link>
								</div>
							</div>
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
