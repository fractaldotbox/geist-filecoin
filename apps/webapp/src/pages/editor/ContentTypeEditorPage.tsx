import { useParams } from "react-router-dom";
import { ContentTypeEditor } from "@/components/react/ContentTypeEditor";

export default function ContentTypeEditorPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Edit Content Type</h1>
			</div>
			<ContentTypeEditor />
		</div>
	);
}
