import { useStore } from "@livestore/react";
import { Plus, Trash2, Eye, EyeOff, Copy, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { allSpaces$ } from "../../livestore/queries";
import { useSpaceStore } from "./hooks/useSpaceStore";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "./ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "./ui/drawer";

const STORAGE_PROVIDERS = [
    {
        value: "storacha",
        label: "Storacha",
        description: "Web3 storage powered by IPFS",
        instructions: "Create a storacha space on https://console.storacha.network/ and enter the did key"
    },
    {
        value: "s3",
        label: "Amazon S3",
        description: "Amazon Simple Storage Service",
        instructions: ""
    },
];

const spaceFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    description: z.string().max(500, "Description must be less than 500 characters").optional(),
    storageProvider: z.enum(["storacha", "s3"], {
        required_error: "Please select a storage provider"
    }),
    spaceProof: z.string().max(10000, "Delegation Proof").optional(),
    // Conditional fields based on storage provider
    spaceKey: z.string().optional(),
    apiKey: z.string().optional(),
});

type SpaceFormData = z.infer<typeof spaceFormSchema>;

interface SpacesDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function SpacesDrawer({ open, onClose }: SpacesDrawerProps) {
    const { store } = useStore();
    const { createSpace, deleteSpace } = useSpaceStore();
    const spaces = store.useQuery(allSpaces$);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [revealedCredentials, setRevealedCredentials] = useState<Record<string, boolean>>({});

    const form = useForm<SpaceFormData>({
        resolver: zodResolver(spaceFormSchema),
        defaultValues: {
            name: "",
            description: "",
            storageProvider: "storacha",
            spaceProof: "",
            spaceKey: "",
            apiKey: "",
        },
    });

    const watchedStorageProvider = form.watch("storageProvider");

    const handleCreateSpace = async (data: SpaceFormData) => {
        // Validate required fields on submit
        let validationError = "";

        if (data.storageProvider === "storacha") {
            if (!data.spaceKey?.trim()) {
                validationError = "Space Key is required for Storacha";
                form.setError("spaceKey", { message: validationError });
                return;
            }
            if (!data.spaceProof?.trim()) {
                validationError = "Space Proof is required for Storacha";
                form.setError("spaceProof", { message: validationError });
                return;
            }
        } else if (data.storageProvider === "s3") {
            if (!data.apiKey?.trim()) {
                validationError = "API Key is required for S3";
                form.setError("apiKey", { message: validationError });
                return;
            }
        }

        const id = `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create credentials based on storage provider
        let storageProviderCredentials = "";
        if (data.storageProvider === "storacha") {
            // For storacha, combine spaceKey and email into credentials
            storageProviderCredentials = JSON.stringify({
                spaceKey: data.spaceKey?.trim() || "",
            });
        } else if (data.storageProvider === "s3") {
            // For S3, use the API key directly
            storageProviderCredentials = data.apiKey?.trim() || "";
        }

        await createSpace({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || "",
            storageProvider: data.storageProvider,
            storageProviderCredentials,
            spaceProof: data.storageProvider === "storacha" ? (data.spaceProof?.trim() || "") : "",
        });

        // Reset form and close
        form.reset();
        setShowCreateForm(false);
    };

    const handleDeleteSpace = async (spaceId: string) => {
        if (confirm("Are you sure you want to delete this space? This action cannot be undone.")) {
            await deleteSpace(spaceId);
        }
    };

    const toggleCredentialVisibility = (spaceId: string) => {
        setRevealedCredentials(prev => ({
            ...prev,
            [spaceId]: !prev[spaceId]
        }));
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const maskCredential = (credential: string) => {
        if (!credential) return "";
        if (credential.length <= 8) return "*".repeat(credential.length);
        return credential.slice(0, 4) + "*".repeat(credential.length - 8) + credential.slice(-4);
    };

    const parseStorageCredentials = (space: any) => {
        if (space.storageProvider === "storacha") {
            try {
                const credentials = JSON.parse(space.storageProviderCredentials || "{}");
                return {
                    spaceKey: credentials.spaceKey || "",
                    spaceProof: space.spaceProof || ""
                };
            } catch {
                return { spaceKey: "", spaceProof: space.spaceProof || "" };
            }
        } else if (space.storageProvider === "s3") {
            return {
                apiKey: space.storageProviderCredentials || ""
            };
        }
        return {};
    };

    return (
        <Drawer direction="right" open={open} onClose={onClose}>
            <DrawerContent className="w-full max-w-2xl">
                <DrawerHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle>Content Spaces</DrawerTitle>
                            <DrawerDescription>
                                Manage your content repositories and workspaces
                            </DrawerDescription>
                        </div>
                        <div className="flex items-center gap-2">

                            <DrawerClose asChild>
                                <Button variant="ghost" size="sm">
                                    <X className="w-4 h-4" />
                                </Button>
                            </DrawerClose>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="text-center">
                        <p>{spaces.length} spaces</p>
                    </div>

                    {/* Create Form */}
                    {showCreateForm && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Create New Space</h3>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleCreateSpace)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="My Content Space" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="A space for managing content..."
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="storageProvider"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Storage Provider</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a storage provider" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {STORAGE_PROVIDERS.map((provider) => (
                                                            <SelectItem key={provider.value} value={provider.value}>
                                                                {provider.label} - {provider.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Conditional fields based on storage provider */}
                                    {watchedStorageProvider === "storacha" ? (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="spaceProof"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Space Proof</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter space proof"
                                                                rows={3}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="spaceKey"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Space Key</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter your Storacha space key" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                        </>
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="apiKey"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>API Key</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="Enter your API key"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Your AWS S3 access key for storage operations
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? "Creating..." : "Create Space"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                form.reset();
                                                setShowCreateForm(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </Card>
                    )}

                    {/* Spaces List */}
                    {spaces.length > 0 ? (
                        <div className="space-y-4">
                            {spaces.map((space) => {
                                const credentials = parseStorageCredentials(space);
                                const isRevealed = revealedCredentials[space.id] || false;

                                return (
                                    <Card key={space.id} className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold mb-1">{space.name}</h3>
                                                <div className="flex gap-2 mb-2">
                                                    <Badge variant="outline">
                                                        {space.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {space.storageProvider === 'storacha' ? 'Storacha' : 'Amazon S3'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSpace(space.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {space.description && (
                                            <p className="text-muted-foreground mb-4">{space.description}</p>
                                        )}

                                        {/* Credentials Section */}
                                        <div className="border-t pt-4 mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Credentials</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleCredentialVisibility(space.id)}
                                                    className="h-6 px-2"
                                                >
                                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                </Button>
                                            </div>

                                            <div className="space-y-2 text-xs">
                                                {space.storageProvider === "storacha" && (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Space Key:</span>
                                                            <div className="flex items-center gap-1">
                                                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                                                                    {isRevealed ? credentials.spaceKey : maskCredential(credentials.spaceKey)}
                                                                </code>
                                                                {isRevealed && credentials.spaceKey && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => copyToClipboard(credentials.spaceKey)}
                                                                        className="h-5 w-5 p-0"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Space Proof:</span>
                                                            <div className="flex items-center gap-1">
                                                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono max-w-20 truncate">
                                                                    {isRevealed ? (
                                                                        <span title={credentials.spaceProof}>
                                                                            {credentials.spaceProof.length > 20
                                                                                ? `${credentials.spaceProof.slice(0, 20)}...`
                                                                                : credentials.spaceProof}
                                                                        </span>
                                                                    ) : (
                                                                        maskCredential(credentials.spaceProof)
                                                                    )}
                                                                </code>
                                                                {isRevealed && credentials.spaceProof && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => copyToClipboard(credentials.spaceProof)}
                                                                        className="h-5 w-5 p-0"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {space.storageProvider === "s3" && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">API Key:</span>
                                                        <div className="flex items-center gap-1">
                                                            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                                                                {isRevealed ? credentials.apiKey : maskCredential(credentials.apiKey)}
                                                            </code>
                                                            {isRevealed && credentials.apiKey && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyToClipboard(credentials.apiKey)}
                                                                    className="h-5 w-5 p-0"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Created {new Date(space.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Plus className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Spaces Yet</h3>
                                <p className="text-muted-foreground mb-4 max-w-md">
                                    Create your first content space to start organizing your repositories and content types.
                                </p>

                            </div>
                        </Card>

                    )}
                    <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Space
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
} 