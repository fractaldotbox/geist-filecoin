import {
	ArrayField,
	DateField,
	FileField,
	TextField,
	TextareaField,
} from "@/components/react/fields";
import type {
	EntryFormData,
	FileFieldValue,
} from "@/components/react/fields/types";
import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import { Form, FormField } from "@/components/react/ui/form";
import { simulateProgress } from "@/components/react/ui/global-progress";
import {
	allEntries$,
	firstSpace$,
	latestStorageAuthorizationForSpace$,
} from "@/livestore/queries";
import {
	type ContentType,
	type ContentTypeField,
	useContentType,
} from "@/stores/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import ky from "ky";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { EditorSidebar } from "./EditorSidebar";
import { MarkdownField } from "./fields/MarkdownField";
import { useLiveStore } from "./hooks/useLiveStore";

import * as Client from "@web3-storage/w3up-client";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import * as Proof from "@web3-storage/w3up-client/proof";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

// Upload mode enum
export enum UploadMode {
	StorachaDelegated = "storacha_delegated",
	Server = "server",
}

/**
 * Uploads a file directly to Storacha using delegated token
 */
async function uploadFileToStoracha(
	file: File,
	delegatedToken: string,
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	try {
		if (!delegatedToken) {
			throw new Error("Storacha delegated token not found");
		}

		// Report initial progress
		if (progressCallback) {
			progressCallback(0.1);
		}

		// Create Storacha client
		const storachaStore = new StoreMemory();
		const client = await Client.create({ store: storachaStore });

		if (progressCallback) {
			progressCallback(0.2);
		}

		// Parse the delegated proof
		const proof = await Proof.parse(delegatedToken);
		const space = await client.addSpace(proof);
		await client.setCurrentSpace(space.did());

		if (progressCallback) {
			progressCallback(0.4);
		}

		// Upload the file using the Storacha client
		const cid = await client.uploadFile(file, {
			onShardStored: () => {
				// Update progress as shards are stored
				if (progressCallback) {
					progressCallback(0.8);
				}
			},
		});

		if (progressCallback) {
			progressCallback(1);
		}

		return {
			cid: cid.toString(),
			url: `https://w3s.link/ipfs/${cid}`,
		};
	} catch (error) {
		console.error("Storacha upload error:", error);
		throw error;
	}
}

/**
 * Uploads a file to server endpoint
 */
async function uploadFileWithApi(
	file: File,
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	try {
		// Create FormData for file upload
		const formData = new FormData();
		formData.append("file", file);

		if (progressCallback) {
			progressCallback(0.5);
		}

		const uploadResponse = (await ky
			.post("/api/upload", {
				body: formData,
			})
			.json()) as { url: string; cid: string };

		console.log("uploadResponse", uploadResponse);

		// Call progress callback
		if (progressCallback) {
			progressCallback(1);
		}

		return {
			cid: uploadResponse.cid,
			url: uploadResponse.url,
		};
	} catch (error) {
		console.error("API upload error:", error);
		throw error;
	}
}

// Function to handle file upload before creating entry event
async function uploadFile(
	media: FileFieldValue | undefined,
	uploadMode: UploadMode = UploadMode.StorachaDelegated,
	progressCallback?: (progress: number) => void,
	delegatedToken?: string,
): Promise<{ url: string; cid: string }> {
	console.log("uploadFile", media, uploadMode);
	// If no media or media doesn't have a file, return empty values
	if (!media || !media.file) {
		return {
			url: media?.url || "",
			cid: media?.cid || "",
		};
	}

	try {
		let uploadResult: { cid: string; url: string };

		// Branch between upload modes
		switch (uploadMode) {
			case UploadMode.StorachaDelegated:
				if (!delegatedToken) {
					throw new Error("Delegated token is required for Storacha upload");
				}
				uploadResult = await uploadFileToStoracha(
					media.file,
					delegatedToken,
					progressCallback,
				);
				break;
			case UploadMode.Server:
				uploadResult = await uploadFileWithApi(media.file, progressCallback);
				break;
			default:
				throw new Error(`Unknown upload mode: ${uploadMode}`);
		}

		return {
			url: uploadResult.url,
			cid: uploadResult.cid,
		};
	} catch (error) {
		console.error("Upload error:", error);
		throw error;
	}
}

export function EntryEditor({
	contentTypeId,
}: {
	contentTypeId?: string;
}) {
	// Get template type from URL or use the contentTypeId passed from props
	const params = new URLSearchParams(window.location.search);
	const contentTypeIdFromUrl =
		contentTypeId || params.get("contentType") || "blog";

	// Use LiveStore-based content type hooks and entry creation
	const contentTypeData = useContentType(contentTypeIdFromUrl);
	const { store, createEntry } = useLiveStore();

	// Get active space and its storage authorization
	const activeSpace = store.useQuery(firstSpace$);
	const storageAuth = activeSpace
		? store.useQuery(latestStorageAuthorizationForSpace$(activeSpace.id))
		: null;

	useEffect(() => {
		return store.subscribe(allEntries$, {
			onUpdate: (newValue) => {
				console.log("allEntries", newValue);
			},
		});
	}, [store]);

	const contentType = contentTypeData
		? {
			type: "object" as const,
			...contentTypeData,
			properties: JSON.parse(contentTypeData.properties) as Record<
				string,
				ContentTypeField
			>,
			required: JSON.parse(contentTypeData.required) as string[],
		}
		: null;

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isAnimated, setIsAnimated] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<
		{ cid: string; url: string } | undefined
	>(undefined);

	// Create form schema based on the loaded content type
	const createFormSchema = (contentType: ContentType) => {
		const schemaShape: Record<string, z.ZodTypeAny> = {};

		for (const [key, field] of Object.entries(contentType.properties)) {
			const isRequired = contentType.required.includes(key);

			if (field.type === "object" && field.properties?.url) {
				schemaShape.media = z.object({
					url: z.string().optional(),
					file: z.instanceof(File).optional(),
					cid: z.string().optional(), // Add the cid property to fix the linter error
				});
			} else if (field.type === "array") {
				schemaShape[key] = z.array(z.string());
			} else if (field.type === "string" && field.format === "date") {
				const dateSchema = z
					.string()
					.refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
						message: "Please enter a valid date",
					});

				schemaShape[key] = isRequired ? dateSchema : dateSchema.optional();
			} else {
				const stringSchema = z.string();
				schemaShape[key] = isRequired
					? stringSchema.min(1, `${field.description} is required`)
					: stringSchema;
			}
		}

		return z.object(schemaShape);
	};

	// Create default values based on content type
	const createDefaultValues = (contentType: ContentType): EntryFormData => {
		const defaultValues: EntryFormData = {};
		for (const key of Object.keys(contentType.properties)) {
			const field = contentType.properties[key];
			if (!field) continue;

			if (field.type === "array") {
				defaultValues[key] = [];
			} else if (field.type === "object" && field.properties?.url) {
				defaultValues[key] = { url: "" };
			} else if (field.type === "string" && field.format === "date") {
				defaultValues[key] = "";
			} else {
				defaultValues[key] = "";
			}
		}
		return defaultValues;
	};

	const formSchema = contentType ? createFormSchema(contentType) : z.object({});
	const defaultValues = contentType ? createDefaultValues(contentType) : {};

	const form = useForm<EntryFormData>({
		resolver: zodResolver(formSchema),
		defaultValues,
		mode: "onTouched",
	});

	// Track form state for errors and dirty fields
	const { errors, dirtyFields } = useFormState({
		control: form.control,
	});

	useEffect(() => {
		if (contentType && contentTypeData) {
			// Trigger animation after form is initialized
			setTimeout(() => {
				setIsAnimated(true);
			}, 100);
		}
	}, [contentType, contentTypeData]);

	// Create entry using LiveStore events instead of direct API calls
	const onSubmit = async (values: EntryFormData) => {
		setIsSubmitting(true);
		setSubmissionResult(undefined); // Reset submission result
		console.log("debug:", values, typeof values);
		try {
			// TODO extract as space attribute
			const uploadMode = UploadMode.StorachaDelegated;
			// Show global progress bar
			await simulateProgress();

			// Get delegated token from storage authorization if using Storacha mode
			let delegatedToken: string | undefined;
			if (uploadMode === UploadMode.StorachaDelegated) {
				if (!storageAuth || !storageAuth.delegationCid) {
					throw new Error(
						"No Storacha storage authorization found for the active space",
					);
				}
				delegatedToken = storageAuth.delegationCid;
			}

			// Handle file upload if needed with specified upload mode
			const media = values?.media as FileFieldValue | undefined;
			const { url, cid } = await uploadFile(
				media,
				uploadMode,
				(progress: number) => {
					setUploadProgress(progress);
				},
				delegatedToken,
			);

			// Create entry using LiveStore event
			await createEntry({
				...values,
				contentTypeId: contentTypeIdFromUrl,
				media: { url: url, cid: cid },
			});

			console.log("Entry created successfully");

			// Set the submission result for the sidebar
			setSubmissionResult({
				cid: cid || "local",
				url: url || "local",
			});
		} catch (error) {
			console.error("Error creating entry:", error);
		} finally {
			setIsSubmitting(false);
			setUploadProgress(0);
		}
	};

	const onInvalidSubmit = () => {
		// Mark all required fields as touched to show validation errors
		if (contentType) {
			for (const field of contentType.required) {
				form.trigger(field);
			}
		}
	};

	const renderField = (
		name: string,
		field: ContentTypeField,
		index: number,
	) => {
		const isRequired = Boolean(contentType?.required.includes(name));
		// A field is dirty if it's been touched by the user or if the form has been submitted
		const isDirty = !!dirtyFields[name] || form.formState.isSubmitted;
		const error = errors[name]?.message as string | undefined;

		// Animation delay based on field index
		const delayClass = isAnimated ? `delay-${Math.min(index * 100, 500)}` : "";
		const animationClass = isAnimated ? "field-slide-up" : "opacity-0";

		if (field.type === "object" && field.properties?.url) {
			// use separate field
			return (
				<FormField
					key={name}
					control={form.control}
					name="media"
					render={({ field: formField }) => (
						<div className={`${animationClass} ${delayClass}`}>
							<FileField
								name={name}
								field={field}
								formField={formField}
								isRequired={isRequired}
								isDirty={isDirty}
								error={error}
							/>
						</div>
					)}
				/>
			);
		}

		if (field.type === "array") {
			return (
				<FormField
					key={name}
					control={form.control}
					name={name}
					render={({ field: formField }) => (
						<div className={`${animationClass} ${delayClass}`}>
							<ArrayField
								name={name}
								field={field}
								formField={formField}
								isRequired={isRequired}
								isDirty={isDirty}
								error={error}
							/>
						</div>
					)}
				/>
			);
		}

		if (field.type === "string" && field.format === "date") {
			return (
				<FormField
					key={name}
					control={form.control}
					name={name}
					render={({ field: formField }) => (
						<div className={`${animationClass} ${delayClass}`}>
							<DateField
								name={name}
								field={field}
								formField={formField}
								isRequired={isRequired}
								isDirty={isDirty}
								error={error}
							/>
						</div>
					)}
				/>
			);
		}

		return (
			<FormField
				key={name}
				control={form.control}
				name={name}
				render={({ field: formField }) => (
					<div className={`${animationClass} ${delayClass}`}>
						{/* always use markdown field for now */}
						{field.description?.toLowerCase()?.includes("content") ? (
							<MarkdownField
								name={name}
								field={field}
								formField={formField}
								isRequired={isRequired}
								isDirty={isDirty}
								error={error}
							/>
						) : (
							<TextField
								name={name}
								field={field}
								formField={formField}
								isRequired={isRequired}
								isDirty={isDirty}
								error={error}
							/>
						)}
					</div>
				)}
			/>
		);
	};

	if (!contentType) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="md:col-span-2">
					<Card className="p-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
								className="space-y-6"
							>
								{Object.entries(contentType.properties).map(
									([name, field], index) => renderField(name, field, index),
								)}
								<Button
									type="submit"
									disabled={isSubmitting}
									className={`w-full ${isAnimated ? "field-slide-up delay-500" : "opacity-0"}`}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{uploadProgress > 0 && uploadProgress < 1
												? `Uploading... ${Math.round(uploadProgress * 100)}%`
												: "Saving..."}
										</>
									) : (
										"Save Content"
									)}
								</Button>
							</form>
						</Form>
					</Card>
				</div>
				<div className="md:col-span-1 sticky top-6">
					<EditorSidebar
						contentType={contentType}
						submissionResult={submissionResult}
					/>
				</div>
			</div>
		</div>
	);
}
