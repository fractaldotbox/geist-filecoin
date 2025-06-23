import { useParams } from "react-router-dom"
import { EntryEditor } from "@/components/react/EntryEditor"
import { ContentHeader } from "@/components/react/ContentHeader"

export default function EntryEditorPage() {
    const { id } = useParams()

    return (
        <div className="container mx-auto p-6">
            <ContentHeader title="Edit Content" />
            <EntryEditor contentTypeId={id as string} />
        </div>
    )
} 