import { Button } from "@/components/react/ui/button";
import type { LucideIcon } from "lucide-react";
import React from "react";

interface ActionBoxProps {
	icon: LucideIcon;
	title: string;
	description: string;
	linkUrl: string;
	buttonText: string;
}

export function ActionBox({
	icon: Icon,
	title,
	description,
	linkUrl,
	buttonText,
}: ActionBoxProps) {
	return (
		<div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
			<div className="flex flex-col items-center text-center">
				<div className="mb-4 text-4xl">
					<Icon className="w-10 h-10" />
				</div>
				<h3 className="text-xl font-semibold mb-2">{title}</h3>
				<p className="text-gray-600 mb-4">{description}</p>
				<a href={linkUrl}>
					<Button>{buttonText}</Button>
				</a>
			</div>
		</div>
	);
}
