import type { SchemaField } from "@/stores/schema";
import type { ControllerRenderProps } from "react-hook-form";

export type EntryFormData = {
  [key: string]: string | string[] | { mediaType: string; url: string; cid?: string; file?: File } | undefined;
};

export type FileFieldValue = {
  mediaType: string;
  file?: File;
  url: string;
  cid?: string;
};

export interface FieldProps {
  name: string;
  field: SchemaField;
  formField: ControllerRenderProps<EntryFormData, string>;
  isRequired: boolean;
  isDirty: boolean;
  error?: string;
} 