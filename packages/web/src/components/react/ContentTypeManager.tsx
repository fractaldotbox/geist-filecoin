import { useStore } from "@livestore/react";
import { AlertCircle, CheckCircle, Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { allContentTypes$ } from "../../livestore/queries";
import { useContentTypeSeeder } from "./hooks/useContentTypeSeeder";
import { useLiveStore } from "./hooks/useLiveStore";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function ContentTypeManager() {
	const { seedContentTypes } = useContentTypeSeeder();
	const { store } = useStore();
	// Query content types from LiveStore
	const contentTypes = store.useQuery(allContentTypes$);

	const handleSeedContentTypes = () => {
		seedContentTypes();
	};

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
