import { EntryEditor } from "@/components/react/EntryEditor";
import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { allEntries$, allSpaces$, useUiState } from "@/livestore/queries";
import { useStore } from "@livestore/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

export default function EntryEditorPage() {
	const { id, "content-type-id": contentTypeId } = useParams();
	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const [uiState, setUiState] = useUiState();
	const entries = store.useQuery(allEntries$);

	// Determine if we're creating a new entry or editing an existing one
	const isNewEntry = Boolean(contentTypeId);
	const entryId = isNewEntry ? undefined : id;

	const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
	const contentTypeName = isNewEntry 
		? (contentTypeId ? contentTypeId.charAt(0).toUpperCase() + contentTypeId.slice(1) : undefined)
		: entry?.contentTypeId
			? entry.contentTypeId.charAt(0).toUpperCase() + entry.contentTypeId.slice(1)
			: undefined;

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<SpaceBreadcrumb
					spaces={spaces}
					currentSpaceId={uiState.currentSpaceId}
					contentType={contentTypeName}
				/>
				<h1 className="text-2xl font-bold">
					{isNewEntry ? "Create Content" : "Edit Content"}
				</h1>
			</div>
			{/* Pass both entryId and contentTypeId to EntryEditor */}
			<EntryEditor 
				entryId={entryId} 
				contentTypeId={isNewEntry ? contentTypeId : undefined} 
			/>
		</div>
	);
}
