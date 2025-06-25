import { AuthStatus } from "@/components/react/AuthStatus";
import { ContentTypeManager } from "@/components/react/ContentTypeManager";

export default function ContentTypesPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<AuthStatus />
			</div>
			<ContentTypeManager />
		</div>
	);
}
