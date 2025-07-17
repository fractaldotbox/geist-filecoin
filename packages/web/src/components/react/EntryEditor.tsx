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
	entryById$,
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
import { useCallback, useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { EditorSidebar } from "./EditorSidebar";
import { useStorachaContext } from "./StorachaProvider";
import { MarkdownField } from "./fields/MarkdownField";
import { useLiveStore } from "./hooks/useLiveStore";

import type { Entry } from "@geist-filecoin/domain";
import { uploadFiles } from "@geist-filecoin/storage";
import type { Client } from "@web3-storage/w3up-client";
import { useParams } from "react-router-dom";

// Upload mode enum
export enum UploadMode {
	StorachaDelegated = "storacha_delegated",
	Server = "server",
}

async function uploadDirectoryToStoracha(
	files: File[],
	client: any,
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	try {
		if (!client) {
			throw new Error("Storacha client not found");
		}

		const cid = await uploadFiles(
			{
				client,
				spaceDid: client.currentSpace()?.did(),
			},
			{
				files,
			} as any,
		);

		// Upload the file using the Storacha client

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
async function uploadFilesWithApi(
	files: File[],
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	try {
		// Create FormData for file upload
		const formData = new FormData();

		for (const file of files) {
			formData.append("file", file);
		}

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

async function uploadDirectory({
	client,
	files,
	progressCallback,
	uploadMode = UploadMode.StorachaDelegated,
}: {
	client?: Client;
	files: File[];
	uploadMode: UploadMode;
	progressCallback?: (progress: number) => void;
}) {
	let uploadResult: { cid: string; url: string } = {
		cid: "",
		url: "",
	};
	switch (uploadMode) {
		case UploadMode.StorachaDelegated:
			if (!client) {
				throw new Error("Storacha client is required for Storacha upload");
			}
			uploadResult = await uploadDirectoryToStoracha(
				files,
				client,
				progressCallback,
			);
			break;
		case UploadMode.Server:
			uploadResult = await uploadFilesWithApi(files, progressCallback);
			break;
		default:
			throw new Error(`Unknown upload mode: ${uploadMode}`);
	}
	console.log("uploadResult", uploadResult);

	return {
		...uploadResult,
	};
}

export function EntryEditor({
	entryId,
}: {
	entryId?: string;
}) {
	const { contentTypeId } = useParams();
	const [isLoaded, setIsLoaded] = useState(false);

	const { store, createEntry } = useLiveStore();
	const existingEntry = store.useQuery(entryById$(entryId || ""));

	const [entry, setEntry] = useState<Entry | null>(null);

	useEffect(() => {
		if (existingEntry) {
			setEntry(existingEntry);
		} else {
			setEntry({});
		}
	}, [existingEntry]);

	// Use LiveStore-based content type hooks and entry creation
	const contentTypeData = useContentType(contentTypeId || "");

	// Get active space and its storage authorization
	const activeSpace = store.useQuery(firstSpace$);
	const storageAuth = activeSpace
		? store.useQuery(latestStorageAuthorizationForSpace$(activeSpace.id))
		: null;

	const { delegation, client } = useStorachaContext();

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

	// Create default values based on content type and entry data
	const createDefaultValues = useCallback(
		(
			contentType: ContentType,
			entryFormData?: Partial<EntryFormData>,
		): Partial<EntryFormData> => {
			const defaultValues: Partial<EntryFormData> = {};

			for (const key of Object.keys(contentType.properties)) {
				const field = contentType.properties[key];
				if (!field) continue;

				if (entryFormData && entryFormData[key] !== undefined) {
					let value = entryFormData[key];
					// Convert Date/null to string for date fields
					if (field.type === "string" && field.format === "date") {
						if (value instanceof Date) {
							value = value.toISOString().slice(0, 10);
						} else if (value === null) {
							value = "";
						}
					}
					defaultValues[key] = value;
				} else if (field.type === "array") {
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
		},
		[],
	);

	// Helper to extract and convert entry values for form defaults
	const getEntryFormDefaults = useCallback(
		(contentType: ContentType, entry: any) => {
			if (!entry) return undefined;
			const result: Record<string, any> = {};
			for (const key of Object.keys(contentType.properties)) {
				const field = contentType.properties[key];
				if (!field) continue;
				let value = entry[key];
				if (field.type === "string" && field.format === "date") {
					if (value instanceof Date) {
						value = value.toISOString().slice(0, 10);
					} else if (value === null) {
						value = "";
					}
				}
				result[key] = value;
			}
			return result;
		},
		[],
	);

	const formSchema = contentType ? createFormSchema(contentType) : z.object({});
	// Only set defaultValues after entry is loaded (if editing)
	const initialDefaultValues = contentType
		? createDefaultValues(
				contentType,
				entryId && entry ? getEntryFormDefaults(contentType, entry) : undefined,
			)
		: {};

	const form = useForm<Partial<EntryFormData>>({
		resolver: zodResolver(formSchema),
		defaultValues: initialDefaultValues,
		mode: "onTouched",
	});

	// Reset form values when entry is loaded (for editing)
	useEffect(() => {
		if (isLoaded) {
			return;
		}
		if (contentType && entryId && entry) {
			const entryData = JSON.parse(entry.data);
			const entryDefaults = createDefaultValues(
				contentType,
				getEntryFormDefaults(contentType, entryData),
			);
			form.reset(entryDefaults);
		}
		setIsLoaded(true);
	}, [
		isLoaded,
		contentType,
		entryId,
		entry,
		form,
		createDefaultValues,
		getEntryFormDefaults,
	]);

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
	const onSubmit = async (values: Partial<EntryFormData>) => {
		if (!entry || !contentTypeId) {
			return;
		}
		setIsSubmitting(true);
		setSubmissionResult(undefined); // Reset submission result
		try {
			// TODO extract as space attribute
			const uploadMode = UploadMode.StorachaDelegated;
			// Show global progress bar
			await simulateProgress();

			if (uploadMode === UploadMode.StorachaDelegated) {
				if (!client || !delegation) {
					throw new Error(
						"No Storacha storage authorization found for the active space",
					);
				}
			}

			// Handle file upload if needed with specified upload mode
			const media = values?.media as FileFieldValue | undefined;

			const entryData = {
				...values,
				media: media?.file?.name,
			};

			const file = new File([JSON.stringify(entryData)], "entry.json");
			const { url, cid } = await uploadDirectory({
				files: [file, media?.file as File],
				uploadMode,
				progressCallback: (progress: number) => {
					setUploadProgress(progress);
				},
				client: client || undefined,
			});

			const entryId = crypto.randomUUID();
			// Create entry using LiveStore event
			await createEntry({
				id: entryId,
				...entryData,
				// TODO allow configure per schema
				name: values.title as string,
				contentTypeId,
				media: { url: url, cid },
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

	if (!contentType || !entry) {
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
