import type { StorageProviderCredentialConfig } from "@geist-filecoin/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import { Root as Collapsible } from "@radix-ui/react-collapsible";
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSpaceStore } from "../components/react/hooks/useSpaceStore";
import { Badge } from "../components/react/ui/badge";
import { Button } from "../components/react/ui/button";
import { Card } from "../components/react/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../components/react/ui/form";
import { Input } from "../components/react/ui/input";
import { Label } from "../components/react/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/react/ui/select";
import { Textarea } from "../components/react/ui/textarea";
import {
	STORAGE_PROVIDER_LABELS,
	STORAGE_PROVIDERS,
	StorageProvider,
} from "../constants/storage-providers";
import { allSpaces$ } from "../livestore/queries";

const spaceFormSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
	description: z
		.string()
		.max(500, "Description must be less than 500 characters")
		.optional(),
	storageProvider: z.nativeEnum(StorageProvider, {
		required_error: "Please select a storage provider",
	}),
	spaceProof: z.string().max(10000, "Delegation Proof").optional(),
	// Conditional fields based on storage provider
	spaceKey: z.string().optional(),
	apiKey: z.string().optional(),
});

type SpaceFormData = z.infer<typeof spaceFormSchema>;

export default function SpacesPage() {
	const { store } = useStore();
	const { createSpace, deleteSpace } = useSpaceStore();
	const spaces = store.useQuery(allSpaces$);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [revealedCredentials, setRevealedCredentials] = useState<
		Record<string, boolean>
	>({});
	const [expandedDetails, setExpandedDetails] = useState<
		Record<string, boolean>
	>({});

	const form = useForm<SpaceFormData>({
		resolver: zodResolver(spaceFormSchema),
		defaultValues: {
			name: "",
			description: "",
			storageProvider: StorageProvider.Storacha,
			spaceProof: "",
			spaceKey: "",
			apiKey: "",
		},
	});

	const watchedStorageProvider = form.watch("storageProvider");

	const handleCreateSpace = async (data: SpaceFormData) => {
		// Validate required fields on submit
		let validationError = "";

		if (data.storageProvider === StorageProvider.Storacha) {
			if (!data.spaceKey?.trim()) {
				validationError = "Space Key is required for Storacha";
				form.setError("spaceKey", { message: validationError });
				return;
			}
		} else if (data.storageProvider === StorageProvider.S3) {
			if (!data.apiKey?.trim()) {
				validationError = "API Key is required for S3";
				form.setError("apiKey", { message: validationError });
				return;
			}
		}

		// Show immediate success feedback
		toast.success("Space created successfully!", {
			description: "Your content space has been created and is now active.",
		});

		// Reset form and close immediately for better UX
		form.reset();
		setShowCreateForm(false);

		const id = `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Create credentials based on storage provider
		let storageProviderCredentials: StorageProviderCredentialConfig[] = [];
		if (data.storageProvider === StorageProvider.Storacha) {
			// For storacha, combine spaceKey and email into credentials
			storageProviderCredentials = [
				{
					type: "value",
					key: "agentKey",
					value: data.spaceKey?.trim() || "",
				},
				{
					type: "value",
					key: "spaceProof",
					value: data.spaceProof?.trim() || "",
				},
			];
		} else if (data.storageProvider === StorageProvider.S3) {
			// For S3, use the API key directly
			storageProviderCredentials = [
				{
					type: "value",
					key: "apiKey",
					value: data.apiKey?.trim() || "",
				},
			];
		}

		try {
			await createSpace({
				id,
				name: data.name.trim(),
				description: data.description?.trim() || "",
				storageProvider: data.storageProvider,
				storageProviderId: "",
				storageProviderCredentials,
			});
		} catch (error) {
			console.error("Failed to create space:", error);
			// Show error toast
			toast.error("Failed to create space", {
				description:
					"There was an error creating your content space. Please try again.",
			});
			// Reopen form on error so user can retry
			setShowCreateForm(true);
		}
	};

	const handleDeleteSpace = async (spaceId: string) => {
		if (
			confirm(
				"Are you sure you want to delete this space? This action cannot be undone.",
			)
		) {
			await deleteSpace(spaceId);
		}
	};

	const toggleCredentialVisibility = (spaceId: string) => {
		setRevealedCredentials((prev) => ({
			...prev,
			[spaceId]: !prev[spaceId],
		}));
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const maskCredential = (credential: string) => {
		if (!credential) return "";
		if (credential.length <= 8) return "*".repeat(credential.length);
		return (
			credential.slice(0, 4) +
			"*".repeat(credential.length - 8) +
			credential.slice(-4)
		);
	};

	const parseStorageCredentials = (space: any) => {
		if (space.storageProvider === "storacha") {
			try {
				const credentials = JSON.parse(
					space.storageProviderCredentials || "{}",
				);
				return {
					spaceKey: credentials.spaceKey || "",
					spaceProof: space.spaceProof || "",
				};
			} catch {
				return { spaceKey: "", spaceProof: space.spaceProof || "" };
			}
		} else if (space.storageProvider === "s3") {
			return {
				apiKey: space.storageProviderCredentials || "",
			};
		}
		return {};
	};

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Content Spaces</h1>
					<p className="text-muted-foreground">
						Manage your content repositories and workspaces
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(!showCreateForm)}>
					<Plus className="w-4 h-4 mr-2" />
					{showCreateForm ? "Cancel" : "Create Space"}
				</Button>
			</div>

			{/* Create Form */}
			{showCreateForm && (
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4">Create New Space</h3>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleCreateSpace)}
							className="space-y-4"
						>
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
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a storage provider" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{STORAGE_PROVIDERS.map((provider) => (
													<SelectItem
														key={provider.value}
														value={provider.value}
													>
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
													<Input
														placeholder="Enter your Storacha space key"
														{...field}
													/>
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

			{/* Spaces Grid */}
			{spaces.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{spaces.map((space) => {
						const credentials = parseStorageCredentials(space);
						const isRevealed = revealedCredentials[space.id] || false;
						const isDetailsExpanded = expandedDetails[space.id] || false;

						return (
							<Card key={space.id} className="p-6 relative">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<h3 className="text-xl font-semibold mb-1">{space.name}</h3>
										<div className="flex gap-2 mb-2">
											<Badge variant="outline">
												{space.isActive ? "Active" : "Inactive"}
											</Badge>
											<Badge variant="secondary">
												{space.storageProvider === "storacha"
													? "Storacha"
													: "Amazon S3"}
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
									<p className="text-muted-foreground mb-4">
										{space.description}
									</p>
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
											{isRevealed ? (
												<EyeOff className="w-3 h-3" />
											) : (
												<Eye className="w-3 h-3" />
											)}
										</Button>
									</div>

									<div className="space-y-2 text-xs">
										{space.storageProvider === "storacha" && (
											<>
												<div className="flex items-center justify-between">
													<span className="text-muted-foreground">
														Space Key:
													</span>
													<div className="flex items-center gap-1">
														<code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
															{isRevealed
																? credentials.spaceKey
																: maskCredential(credentials.spaceKey)}
														</code>
														{isRevealed && credentials.spaceKey && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	copyToClipboard(credentials.spaceKey)
																}
																className="h-5 w-5 p-0"
															>
																<Copy className="w-3 h-3" />
															</Button>
														)}
													</div>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-muted-foreground">
														Space Proof:
													</span>
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
																onClick={() =>
																	copyToClipboard(credentials.spaceProof)
																}
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
														{isRevealed
															? credentials.apiKey
															: maskCredential(credentials.apiKey)}
													</code>
													{isRevealed && credentials.apiKey && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																copyToClipboard(credentials.apiKey)
															}
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
									<span>
										Created {new Date(space.createdAt).toLocaleDateString()}
									</span>
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
							Create your first content space to start organizing your
							repositories and content types.
						</p>
						<Button onClick={() => setShowCreateForm(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Create Your First Space
						</Button>
					</div>
				</Card>
			)}
		</div>
	);
}
