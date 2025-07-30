import { useStore } from "@livestore/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { EntryEditor } from "@/components/react/EntryEditor";
import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { allEntries$, allSpaces$, useUiState } from "@/livestore/queries";
import AccessControlPanel from "./AccessControlPanel";

export default function AccessControlPage() {
	const { id } = useParams();
	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const [uiState, setUiState] = useUiState();
	const entries = store.useQuery(allEntries$);

	const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
	const contentTypeName = entry?.contentTypeId
		? entry.contentTypeId.charAt(0).toUpperCase() + entry.contentTypeId.slice(1)
		: undefined;

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Access Control</h1>
			</div>

			<div className="mx-auto p-6">
				<AccessControlPanel />
			</div>
		</div>
	);
}
