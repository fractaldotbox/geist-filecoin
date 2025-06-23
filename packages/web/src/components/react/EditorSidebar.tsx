import { Card } from "@/components/react/ui/card";
import type { ContentType } from "@/stores/schema";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface EditorSidebarProps {
	contentType: ContentType;
	submissionResult?: {
		cid: string;
		url: string;
	};
}

export function EditorSidebar({
	contentType,
	submissionResult,
}: EditorSidebarProps) {
	const [isContentTypeExpanded, setIsContentTypeExpanded] = useState(false);

	return (
		<div className="space-y-4">
			<Card className="p-4">
				<div className="space-y-6">
					{/* Content Type Section */}
					<div>
						<button
							type="button"
							onClick={() => setIsContentTypeExpanded(!isContentTypeExpanded)}
							className="flex items-center justify-between w-full text-left"
						>
							<h2 className="text-lg font-semibold">Content Type</h2>
							{isContentTypeExpanded ? (
								<ChevronDown className="h-4 w-4" />
							) : (
								<ChevronRight className="h-4 w-4" />
							)}
						</button>
						{isContentTypeExpanded && contentType && (
							<div className="mt-4 space-y-2 text-sm">
								<div className="font-medium">Type: {contentType.type}</div>
								<div className="font-medium">Required fields:</div>
								<ul className="list-disc pl-4">
									{contentType.required.map((field) => (
										<li key={field}>{field}</li>
									))}
								</ul>
								<div className="font-medium mt-2">Properties:</div>
								<ul className="list-disc pl-4">
									{Object.entries(contentType.properties).map(([name, field]) => (
										<li key={name}>
											{name} ({field.type})
											{field.format && ` - ${field.format}`}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			</Card>
			{submissionResult && (
				<Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
					<div className="space-y-3">
						<h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
							Content Published!
						</h2>
						<div className="space-y-2">
							<div className="text-sm">
								<div className="font-medium">IPFS CID:</div>
								<div className="font-mono text-xs break-all overflow-x-auto p-2 bg-white dark:bg-black/20 rounded border border-green-100 dark:border-green-900/50">
									<a
										href={submissionResult.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										{submissionResult.cid}
									</a>
								</div>
							</div>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
}
