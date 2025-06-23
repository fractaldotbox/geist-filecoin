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

// This would normally be imported from the Lighthouse SDK
// import lighthouse from "@lighthouse-web3/sdk";

/**
 * Uploads a file to IPFS using Lighthouse
 */
async function uploadFileToLighthouse(
	file: File,
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	// Simulate uploading for now
	// When the SDK is properly installed, replace this with actual lighthouse upload
	// const output = await lighthouse.upload(file, process.env.LIGHTHOUSE_API_KEY);

	// Simulate progress
	for (let i = 0; i <= 10; i++) {
		if (progressCallback) {
			progressCallback(i / 10);
		}
		await new Promise((resolve) => setTimeout(resolve, 300));
	}

	// Simulate final response
	const randomCid = `bafybeig${Math.random().toString(36).substring(2, 10)}`;
	return {
		cid: randomCid,
		url: `https://gateway.lighthouse.storage/ipfs/${randomCid}`,
	};
}

// New API endpoint upload function
async function submitContent(
	values: EntryFormData,
	progressCallback?: (progress: number) => void,
): Promise<{ cid: string; url: string }> {
	try {
		console.log("submit", values);

		const media = values?.media as FileFieldValue;
		let uploadResponse: { url: string; cid: string } | undefined;

		// Create a copy of the values to modify
		const submissionData = { ...values };

		// Check if media has a URL starting with blob: (which means it's a local file reference)
		if (media?.file) {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append("file", media.file);

			uploadResponse = (await ky
				.post("/api/upload", {
					body: formData,
				})
				.json()) as { url: string; cid: string };

			console.log("uploadResponse", uploadResponse);
			// Update the media object with the remote URL and CID
			//@ts-ignore
			submissionData.media = {
				mediaType: media.mediaType,
				cid: uploadResponse.cid,
			};
		}

		const response = await ky.post("/api/submit", {
			json: submissionData,
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorData = (await response.json()) as { message?: string };
			throw new Error(errorData.message || "Upload failed");
		}

		const data = (await response.json()) as { cid: string; url: string };

		// Call progress callback with completion
		if (progressCallback) {
			progressCallback(1);
		}

		return {
			cid: data.cid,
			url: data.url,
		};
	} catch (error) {
		console.error("Upload error:", error);
		throw error;
	}
}

export function EntryEditor({ contentTypeId }: { contentTypeId?: string }) {
	// Get template type from URL or use the contentTypeId passed from props
	const params = new URLSearchParams(window.location.search);
	const contentTypeIdFromUrl =
		contentTypeId || params.get("contentType") || "blog";

	// Use LiveStore-based content type hooks
	const contentTypeData = useContentType(contentTypeIdFromUrl);

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

			if (field.type === "object" && field.properties?.mediaType) {
				schemaShape.media = z.object({
					mediaType: z.string().optional(),
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
			} else if (field.type === "object" && field.properties?.mediaType) {
				defaultValues[key] = { mediaType: "", url: "" };
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

	// Decouple the file upload and metadata upload
	// as easier to use form-data for the file upload
	// and json for the metadata upload

	const onSubmit = async (values: EntryFormData) => {
		setIsSubmitting(true);
		setSubmissionResult(undefined); // Reset submission result
		console.log("debug:", values, typeof values);
		try {
			// Show global progress bar
			await simulateProgress();

			const uploadResult = await submitContent(values, (progress) => {
				setUploadProgress(progress);
			});

			console.log("uploadResult", uploadResult);
			// Process the submission with uploaded files
			console.log("Form submitted with processed data:", values);

			// Set the submission result
			setSubmissionResult(uploadResult);
		} catch (error) {
			console.error("Error submitting form:", error);
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

		if (field.type === "object" && field.properties?.mediaType) {
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
