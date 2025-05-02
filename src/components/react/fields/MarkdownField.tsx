import { useState } from "react";
import { Textarea } from "@/components/react/ui/textarea";
import {
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/react/ui/form";
import type { FieldProps } from "./types";
import { AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/react/ui/tabs";

export function MarkdownField({ name, field, formField, isRequired, isDirty, error }: FieldProps) {
    const [activeTab, setActiveTab] = useState<string>("edit");

    return (
        <FormItem className="space-y-1">
            <FormLabel>
                {field.description}
                {isRequired ? " *" : ""}
            </FormLabel>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-2">
                    <FormControl>
                        <Textarea
                            value={formField.value as string}
                            onChange={formField.onChange}
                            onBlur={formField.onBlur}
                            name={formField.name}
                            ref={formField.ref}
                            placeholder={`Enter ${name} (supports Markdown)...`}
                            className={`min-h-[200px] ${error && isDirty ? "border-destructive" : ""}`}
                        />
                    </FormControl>
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                    <div className="min-h-[200px] p-3 border rounded-md overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                        {formField.value ? (
                            <ReactMarkdown>{formField.value as string}</ReactMarkdown>
                        ) : (
                            <p className="text-muted-foreground">Nothing to preview</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
            {isDirty && error && (
                <div className="flex items-center gap-2 text-destructive text-sm mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <FormMessage>{error}</FormMessage>
                </div>
            )}
        </FormItem>
    );
} 