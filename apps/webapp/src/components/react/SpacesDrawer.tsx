import type { StorageProviderCredentialConfig } from "@geist-filecoin/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import {
	Root as Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
	CheckCircle,
	ChevronDown,
	ChevronsUpDown,
	Copy,
	Eye,
	EyeOff,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
	STORAGE_PROVIDERS,
	STORAGE_PROVIDER_LABELS,
	StorageProvider,
} from "../../constants/storage-providers";
import { allSpaces$, useUiState } from "../../livestore/queries";
import { useLiveStore } from "./hooks/useLiveStore";
import { useSpaceStore } from "./hooks/useSpaceStore";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "./ui/drawer";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

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
	const { createSpace, updateSpace, deleteSpace } = useSpaceStore();
	const spaces = store.useQuery(allSpaces$);
	const [uiState, setUiState] = useUiState();
	const currentSpaceId = uiState?.currentSpaceId || "";
	const navigate = useNavigate();

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
			spaceKey: "",
			apiKey: "",
		},
	});

	useEffect(() => {
		if (uiState?.currentSpaceId) {
			return;
		}

		const targetSpaceId = spaces?.[0]?.id;
		if (targetSpaceId && targetSpaceId !== uiState?.currentSpaceId) {
			setUiState({ currentSpaceId: targetSpaceId });
		}
	}, [uiState?.currentSpaceId, setUiState, spaces?.[0]?.id]);

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

		// Deactivate all existing spaces before creating the new active space
		await setUiState({ currentSpaceId: id });

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
					value: "",
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

	const handleSetActiveSpace = async (targetSpaceId: string) => {
		// Set the target space as active
		await setUiState({ currentSpaceId: targetSpaceId });

		// Close the drawer and redirect to content-types page
		onClose();
		navigate("/");
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
		if (space.storageProvider === StorageProvider.Storacha) {
			try {
				const credentials = JSON.parse(
					space.storageProviderCredentials || "{}",
				);
				return {
					...credentials,
				};
			} catch {
				return { spaceKey: "", spaceProof: space.spaceProof || "" };
			}
		} else if (space.storageProvider === StorageProvider.S3) {
			return {
				apiKey: space.storageProviderCredentials || "",
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

				<div className="flex-1 overflow-y-auto p-3 space-y-6">
					{/* Create Form */}
					{showCreateForm && (
						<Card className="p-3">
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
									{watchedStorageProvider === StorageProvider.Storacha ? (
										<>
											{/* TODO provider specific labels */}
											<FormField
												control={form.control}
												name="spaceKey"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Storage Provider ID</FormLabel>
														<FormControl>
															<Input
																placeholder="For Storacha, enter the space key"
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
										<Button
											type="submit"
											disabled={form.formState.isSubmitting}
										>
											{form.formState.isSubmitting
												? "Creating..."
												: "Create Space"}
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
								const isDetailsExpanded = expandedDetails[space.id] || false;
								const isActive = space.id === currentSpaceId;

								return (
									<Card
										key={space.id}
										className={`p-6 ${isActive ? "border-green-500 border-2" : ""}`}
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1">
												<h3 className="text-xl font-semibold mb-1 flex flex-row align-center items-center gap-2">
													{isActive ? (
														<div className="w-3 h-3 bg-green-500 rounded-full" />
													) : (
														<></>
													)}
													{space.name}
												</h3>
												<div className="flex gap-2 items-center">
													<Badge variant="secondary">
														{
															STORAGE_PROVIDER_LABELS[
																space.storageProvider as StorageProvider
															]
														}
													</Badge>
												</div>
											</div>
											<div className="flex gap-2">
												{!isActive && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleSetActiveSpace(space.id)}
													>
														<CheckCircle className="w-4 h-4 mr-1" />
														Select Space
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeleteSpace(space.id)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>

										{/* Details Section with grouped description and credentials */}
										<div className="pt-4 mb-4">
											<Collapsible
												open={isDetailsExpanded}
												onOpenChange={(open) => {
													setExpandedDetails((prev) => ({
														...prev,
														[space.id]: open,
													}));
												}}
											>
												<div className="flex items-center justify-end">
													<CollapsibleTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 px-2"
														>
															{isDetailsExpanded ? (
																<ChevronDown className="w-3 h-3" />
															) : (
																<ChevronsUpDown className="w-3 h-3" />
															)}
														</Button>
													</CollapsibleTrigger>
												</div>
												<CollapsibleContent>
													<div className="space-y-4 mt-4">
														{/* Description */}
														{space.description && (
															<div>
																<h5 className="text-sm font-medium mb-2">
																	Description
																</h5>
																<p className="text-muted-foreground text-sm">
																	{space.description}
																</p>
															</div>
														)}

														{/* Credentials */}
														<div>
															<div className="flex items-center justify-between mb-2">
																<h5 className="text-sm font-medium">
																	Credentials
																</h5>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() =>
																		toggleCredentialVisibility(space.id)
																	}
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
																{space.storageProvider ===
																	StorageProvider.Storacha && (
																	// biome-ignore lint/complexity/noUselessFragments: <explanation>
																	<>
																		<div className="flex items-center justify-between">
																			<span className="text-muted-foreground">
																				Space Key:
																			</span>
																			<div className="flex items-center gap-1">
																				{/* <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
																						{isRevealed
																							? credentials.spaceKey
																							: maskCredential(
																								credentials.spaceKey,
																							)}
																					</code> */}
																			</div>
																		</div>
																	</>
																)}

																{space.storageProvider ===
																	StorageProvider.S3 && (
																	<div className="flex items-center justify-between">
																		<span className="text-muted-foreground">
																			API Key:
																		</span>
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
													</div>
													<div className="flex items-center justify-between text-sm text-muted-foreground">
														<span>
															Created{" "}
															{new Date(space.createdAt).toLocaleDateString()}
														</span>
													</div>
												</CollapsibleContent>
											</Collapsible>
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
