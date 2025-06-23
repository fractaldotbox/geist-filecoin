import { ContentHeader } from "@/components/react/ContentHeader";
import { EntryEditor } from "@/components/react/EntryEditor";
import { useParams } from "react-router-dom";

export default function EntryEditorPage() {
	const { id } = useParams();

	return (
		<div className="container mx-auto p-6">
			<ContentHeader title="Edit Content" />
			<EntryEditor contentTypeId={id as string} />
		</div>
	);
}
