import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/react/ui/form";
import { Textarea } from "@/components/react/ui/textarea";
import { AlertCircle } from "lucide-react";
import type { FieldProps } from "./types";

export function ArrayField({
	name,
	field,
	formField,
	isRequired,
	isDirty,
	error,
}: FieldProps) {
	return (
		<FormItem className="space-y-1">
			<FormLabel>
				{field.description}
				{isRequired ? " *" : ""}
			</FormLabel>
			<FormControl>
				<Textarea
					value={
						Array.isArray(formField.value) ? formField.value.join("\n") : ""
					}
					onChange={(e) => formField.onChange(e.target.value.split("\n"))}
					placeholder={`Enter ${name}...`}
					className={`min-h-[100px] ${error && isDirty ? "border-destructive" : ""}`}
				/>
			</FormControl>
			{isDirty && error && (
				<div className="flex items-center gap-2 text-destructive text-sm mt-1">
					<AlertCircle className="h-4 w-4" />
					<FormMessage>{error}</FormMessage>
				</div>
			)}
		</FormItem>
	);
}
