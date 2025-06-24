import { useStore } from "@livestore/react";
import { AlertCircle, CheckCircle, Download, RefreshCw, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { allContentTypes$, allSpaces$ } from "../../livestore/queries";
import { useContentTypeSeeder } from "./hooks/useContentTypeSeeder";
import { useLiveStore } from "./hooks/useLiveStore";
import { useSpacesDrawer } from "../../App";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function ContentTypeManager() {
	const { seedContentTypes } = useContentTypeSeeder();
	const { store } = useStore();
	const { openSpacesDrawer } = useSpacesDrawer();

	// Query content types and spaces from LiveStore
	const contentTypes = store.useQuery(allContentTypes$);
	const spaces = store.useQuery(allSpaces$);
	const hasSpaces = spaces.length > 0;

	const handleSeedContentTypes = () => {
		seedContentTypes();
	};

	if (!hasSpaces) {
		return (
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Content Type Manager</h1>
						<p className="text-muted-foreground">
							Manage your content types and seed from available content types
						</p>
					</div>
				</div>

				{/* No spaces warning */}
				<Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
					<AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
					<AlertDescription className="text-orange-800 dark:text-orange-300">
						<div className="flex flex-col gap-3">
							<p>
								<strong>Space Required:</strong> You need to create a content space before you can work with content types.
								Spaces define where your content will be stored and how it's organized.
							</p>
							<Button onClick={openSpacesDrawer} className="self-start" size="sm">
								<Folder className="w-4 h-4 mr-2" />
								Create Your First Space
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Content Type Manager</h1>
					<p className="text-muted-foreground">
						Manage your content types and seed from available content types
					</p>
				</div>
			</div>

			{/* Content Type Grid */}
			{contentTypes.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{contentTypes.map((contentType) => (
						<Card key={contentType.id} className="p-6">
							<div className="flex items-start justify-between mb-4">
								<h2 className="text-xl font-semibold">
									{contentType.name ||
										contentType.id.charAt(0).toUpperCase() +
										contentType.id.slice(1)}
								</h2>
								<Badge variant="outline">Content Type</Badge>
							</div>

							<p className="text-muted-foreground mb-4">
								{contentType.description}
							</p>

							<div className="flex gap-2">
								<Link to={`/editor/entry/${contentType.id}`} className="flex-1">
									<Button className="w-full">Use Content Type</Button>
								</Link>
							</div>
						</Card>
					))}
				</div>
			)}

			{contentTypes.length === 0 && (
				<Card className="p-12 text-center">
					<h3 className="text-lg font-semibold mb-2">
						No Content Types Available
					</h3>
					<p className="text-muted-foreground mb-4">
						Get started by seeding content types from the available templates.
					</p>
					<Button onClick={handleSeedContentTypes}>
						Seed Demo Content Types
					</Button>
				</Card>
			)}
		</div>
	);
}
