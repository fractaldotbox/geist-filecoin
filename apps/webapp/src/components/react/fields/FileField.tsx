import { AlertCircle } from "lucide-react";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/react/ui/form";
import { Input } from "@/components/react/ui/input";
import { FileInput } from "./FileInput";
import type { FieldProps, FileFieldValue } from "./types";

export function FileField({
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
				<div className="space-y-2">
					<FileInput
						field={formField}
						accept="image/*"
						className={`cursor-pointer ${error && isDirty ? "border-destructive" : ""}`}
					/>
					{(formField.value as FileFieldValue)?.url && (
						<div className="mt-2">
							<img
								src={(formField.value as FileFieldValue).url}
								alt="Preview"
								className="max-w-full h-auto max-h-48 rounded"
							/>
						</div>
					)}
				</div>
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
