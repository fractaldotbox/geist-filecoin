import { ContentTypeEditor } from "@/components/react/ContentTypeEditor";
import { useParams } from "react-router-dom";

export default function ContentTypeEditorPage() {
	const { id } = useParams<{ id: string }>();

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Edit Content Type</h1>
			</div>
			<ContentTypeEditor />
		</div>
	);
}
