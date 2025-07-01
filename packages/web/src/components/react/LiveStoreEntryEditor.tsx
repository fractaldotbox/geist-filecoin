import { useStore } from "@livestore/react";
import { allEntries$, useUiState } from "../../livestore/queries";
import { useLiveStore } from "./hooks/useLiveStore";

export function LiveStoreEntryEditor() {
	const { store } = useStore();
	const { createEntry } = useLiveStore();

	// Query data from LiveStore
	const entries = store.useQuery(allEntries$);
	const [uiState, setUiState] = useUiState();

	return (
		<div>
			<h2>LiveStore Entry Editor</h2>
			<p>Total entries: {entries.length}</p>
			<p>Current content type: {uiState?.currentContentTypeId}</p>
		</div>
	);
}
