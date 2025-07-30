import { useStore } from "@livestore/react";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { EntryEditor } from "@/components/react/EntryEditor";
import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { allEntries$, allSpaces$, useUiState } from "@/livestore/queries";

export default function EntryEditorPage() {
	const { entryId, contentTypeId, spaceId } = useParams();

	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const [uiState, setUiState] = useUiState();
	const entries = store.useQuery(allEntries$);

	const location = useLocation();
	// const isNewEntry = location.pathname.includes('/new');

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
