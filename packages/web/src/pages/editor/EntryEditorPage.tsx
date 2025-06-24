import { EntryEditor } from "@/components/react/EntryEditor";
import { useParams } from "react-router-dom";

export default function EntryEditorPage() {
	const { id } = useParams();

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Edit Content</h1>
			</div>
			<EntryEditor contentTypeId={id as string} />
		</div>
	);
}
