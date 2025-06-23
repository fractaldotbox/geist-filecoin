import { ContentHeader } from "@/components/react/ContentHeader";
import { ContentTypeEditor } from "@/components/react/ContentTypeEditor";
import { useParams } from "react-router-dom";

export default function ContentTypeEditorPage() {
	const { id } = useParams<{ id: string }>();

	return (
		<div className="container mx-auto p-6">
			<ContentHeader title="Edit Content Type" />
			<ContentTypeEditor />
		</div>
	);
}
