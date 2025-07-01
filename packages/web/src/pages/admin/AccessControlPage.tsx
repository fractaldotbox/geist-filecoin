import { EntryEditor } from "@/components/react/EntryEditor";
import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { allEntries$, allSpaces$, useUiState } from "@/livestore/queries";
import { useStore } from "@livestore/react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
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
            <div>
                Access Control
            </div>
            <div className="mb-6">
                <SpaceBreadcrumb
                    spaces={spaces}
                    currentSpaceId={uiState.currentSpaceId}
                    contentType={contentTypeName}
                />
                <h1 className="text-2xl font-bold">Edit Content</h1>
            </div>
            <AccessControlPanel />
        </div>
    );
}
