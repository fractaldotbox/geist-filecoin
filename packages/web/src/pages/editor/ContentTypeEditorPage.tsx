import { useParams } from "react-router-dom"
import { ContentTypeEditor } from "@/components/react/ContentTypeEditor"
import { ContentHeader } from "@/components/react/ContentHeader"

export default function ContentTypeEditorPage() {
    const { id } = useParams<{ id: string }>()

    return (
        <div className="container mx-auto p-6">
            <ContentHeader title="Edit Content Type" />
            <ContentTypeEditor />
        </div>
    )
} 