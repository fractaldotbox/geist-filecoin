import { useState, useEffect } from "react";
import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import { Input } from "@/components/react/ui/input";
import { Textarea } from "@/components/react/ui/textarea";
import { useStore } from '@nanostores/react';
import { schemaStore, loadSchema } from '@/stores/schema';
import { ChevronDown, ChevronRight } from "lucide-react";

interface SchemaField {
    type: string;
    description: string;
    format?: string;
    items?: {
        type: string;
    };
}

interface Schema {
    type: string;
    properties: Record<string, SchemaField>;
    required: string[];
}

interface ContentData {
    [key: string]: string | string[];
}

export function EntryEditor() {
    const schema = useStore(schemaStore);
    const [content, setContent] = useState<ContentData>({});
    const [isSchemaExpanded, setIsSchemaExpanded] = useState(false);

    useEffect(() => {
        // Get template type from URL
        const params = new URLSearchParams(window.location.search);
        const template = params.get('template') || 'blog';

        // Load schema based on template
        loadSchema(template);
    }, []);

    useEffect(() => {
        if (schema) {
            // Initialize content with empty values
            const initialContent: ContentData = {};
            for (const key of Object.keys(schema.properties)) {
                if (schema.properties[key].type === 'array') {
                    initialContent[key] = [];
                } else {
                    initialContent[key] = '';
                }
            }
            setContent(initialContent);
        }
    }, [schema]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saving content:", content);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setContent((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const renderField = (name: string, field: SchemaField) => {
        const isRequired = schema?.required.includes(name);
        const label = `${field.description}${isRequired ? ' *' : ''}`;
        const id = `field-${name}`;

        if (field.type === 'array') {
            return (
                <div key={name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">{label}</label>
                    <Textarea
                        id={id}
                        name={name}
                        value={Array.isArray(content[name]) ? (content[name] as string[]).join('\n') : ''}
                        onChange={handleChange}
                        placeholder={`Enter ${name}...`}
                        className="min-h-[100px]"
                    />
                </div>
            );
        }

        if (field.type === 'string' && field.format === 'date') {
            return (
                <div key={name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">{label}</label>
                    <Input
                        id={id}
                        type="date"
                        name={name}
                        value={content[name] as string}
                        onChange={handleChange}
                    />
                </div>
            );
        }

        return (
            <div key={name} className="space-y-2">
                <label htmlFor={id} className="text-sm font-medium">{label}</label>
                {field.description.toLowerCase().includes('content') ? (
                    <Textarea
                        id={id}
                        name={name}
                        value={content[name] as string}
                        onChange={handleChange}
                        placeholder={`Enter ${name}...`}
                        className="min-h-[200px]"
                    />
                ) : (
                    <Input
                        id={id}
                        name={name}
                        value={content[name] as string}
                        onChange={handleChange}
                        placeholder={`Enter ${name}...`}
                    />
                )}
            </div>
        );
    };

    if (!schema) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2">
                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {Object.entries(schema.properties).map(([name, field]) =>
                                renderField(name, field)
                            )}
                        </form>
                    </Card>
                </div>
                {/* Sidebar */}
                <div className="md:col-span-1 sticky top-6">
                    <Card className="p-4">
                        <div className="space-y-6">
                            {/* Schema Section */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setIsSchemaExpanded(!isSchemaExpanded)}
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <h2 className="text-lg font-semibold">Schema</h2>
                                    {isSchemaExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                {isSchemaExpanded && schema && (
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="font-medium">Type: {schema.type}</div>
                                        <div className="font-medium">Required fields:</div>
                                        <ul className="list-disc pl-4">
                                            {schema.required.map((field) => (
                                                <li key={field}>{field}</li>
                                            ))}
                                        </ul>
                                        <div className="font-medium mt-2">Properties:</div>
                                        <ul className="list-disc pl-4">
                                            {Object.entries(schema.properties).map(([name, field]) => (
                                                <li key={name}>
                                                    {name} ({field.type})
                                                    {field.format && ` - ${field.format}`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <h2 className="text-lg font-semibold mb-4">Action</h2>
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full"
                                >
                                    Save Content
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
} 