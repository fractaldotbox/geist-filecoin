import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./ui/breadcrumb";

export interface Space {
	id: string;
	name: string;
	description: string;
	storageProvider: string;
	storageProviderCredentials: string;
	storageProviderId: string;
	spaceProof: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
}

interface SpaceBreadcrumbProps {
	spaces: readonly Space[];
	currentSpaceId: string;
	contentType?: string;
}

export default function SpaceBreadcrumb({
	spaces,
	currentSpaceId,
	contentType,
}: SpaceBreadcrumbProps) {
	const space = spaces.find((s) => s.id === currentSpaceId);
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link to="/">Home</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link to={`/space/${currentSpaceId}/entries`}>
							{space?.name || "Unknown Space"}
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				{contentType && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{contentType}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
