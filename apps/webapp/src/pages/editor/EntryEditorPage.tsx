import { EntryEditor } from "@/components/react/EntryEditor";
import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { allSpaces$, useUiState } from "@/livestore/queries";
import { useStore } from "@livestore/react";
import { useParams } from "react-router-dom";

export default function EntryEditorPage() {
	const { entryId, contentTypeId } = useParams();

	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const [uiState] = useUiState();

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<SpaceBreadcrumb
					spaces={spaces}
					currentSpaceId={uiState.currentSpaceId}
					contentType={contentTypeId}
				/>
				<h1 className="text-2xl font-bold">Edit Content</h1>
			</div>
			<EntryEditor entryId={entryId as string} />
		</div>
	);
}
