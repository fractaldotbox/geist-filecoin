import type { ContentTypeField } from "@/stores/schema";
import type { ControllerRenderProps } from "react-hook-form";

export type EntryFormData = {
	id: string;
	[key: string]:
		| string
		| string[]
		| { spaceId?: string; cid?: string }
		| undefined;
};

export type FileFieldValue = {
	file?: File;
	url?: string;
	cid?: string;
};

export interface FieldProps {
	name: string;
	field: ContentTypeField;
	formField: ControllerRenderProps<EntryFormData, string>;
	isRequired: boolean;
	isDirty: boolean;
	error?: string;
}
