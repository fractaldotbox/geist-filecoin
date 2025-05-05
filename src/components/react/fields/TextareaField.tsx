import { Textarea } from "@/components/react/ui/textarea";
import {
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/react/ui/form";
import type { FieldProps } from "./types";
import { AlertCircle } from "lucide-react";

export function TextareaField({ name, field, formField, isRequired, isDirty, error }: FieldProps) {
    return (
        <FormItem className="space-y-1">
            <FormLabel>
                {field.description}
                {isRequired ? " *" : ""}
            </FormLabel>
            <FormControl>
                <Textarea
                    value={formField.value as string}
                    onChange={formField.onChange}
                    onBlur={formField.onBlur}
                    name={formField.name}
                    ref={formField.ref}
                    placeholder={`Enter ${name}...`}
                    className={`min-h-[200px] ${error && isDirty ? "border-destructive" : ""}`}
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