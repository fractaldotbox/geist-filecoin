import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import { loadSchema, schemaStore, type Schema, type SchemaField } from "@/stores/schema";
import { useStore } from "@nanostores/react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ky from "ky";
import {
	Form,
	FormField,
} from "@/components/react/ui/form";
import {
	ArrayField,
	DateField,
	FileField,
	TextField,
	TextareaField,
} from "@/components/react/fields";
import { simulateProgress } from "@/components/react/ui/global-progress";
import type { EntryFormData, FileFieldValue } from "@/components/react/fields/types";
import { MarkdownField } from "./fields/MarkdownField";

// This would normally be imported from the Lighthouse SDK
// import lighthouse from "@lighthouse-web3/sdk";

/**
 * Uploads a file to IPFS using Lighthouse
 */
async function uploadFileToLighthouse(file: File, progressCallback?: (progress: number) => void): Promise<{ cid: string, url: string }> {
	// Simulate uploading for now
	// When the SDK is properly installed, replace this with actual lighthouse upload
	// const output = await lighthouse.upload(file, process.env.LIGHTHOUSE_API_KEY);

	// Simulate progress
	for (let i = 0; i <= 10; i++) {
		if (progressCallback) {
			progressCallback(i / 10);
		}
		await new Promise(resolve => setTimeout(resolve, 300));
	}

	// Simulate final response
	const randomCid = `bafybeig${Math.random().toString(36).substring(2, 10)}`;
	return {
		cid: randomCid,
		url: `https://gateway.lighthouse.storage/ipfs/${randomCid}`,
	};
}

// New API endpoint upload function
async function submitContent(values: EntryFormData, progressCallback?: (progress: number) => void): Promise<{ cid: string, url: string }> {
	try {
		console.log('submit', values);

		const media = values?.media as FileFieldValue;
		let uploadResponse: { url: string; cid: string } | undefined;

		// Create a copy of the values to modify
		const submissionData = { ...values };

		// Check if media has a URL starting with blob: (which means it's a local file reference)
		if (media?.file) {

			// Create FormData for file upload
			const formData = new FormData();
			formData.append('file', media.file);

			uploadResponse = await ky.post('/api/upload', {
				body: formData
			}).json() as { url: string; cid: string };


			console.log('uploadResponse', uploadResponse);
			// Update the media object with the remote URL and CID
			//@ts-ignore
			submissionData.media = {
				mediaType: media.mediaType,
				cid: uploadResponse.cid
			};
		}

		console.log('submissionData', submissionData);

		const response = await ky.post('/api/submit', {
			json: submissionData,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const errorData = await response.json() as { message?: string };
			throw new Error(errorData.message || 'Upload failed');
		}

		const data = await response.json() as { cid: string; url: string };

		// Call progress callback with completion
		if (progressCallback) {
			progressCallback(1);
		}

		return {
			cid: data.cid,
			url: data.url,
		};
	} catch (error) {
		console.error('Upload error:', error);
		throw error;
	}
}


export function EntryEditor({ schemaId }: { schemaId?: string }) {
	const schema = useStore(schemaStore);
	const [isSchemaExpanded, setIsSchemaExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isAnimated, setIsAnimated] = useState(false);

	// Create form schema based on the loaded schema
	const createFormSchema = (schema: Schema) => {
		const schemaShape: Record<string, z.ZodTypeAny> = {};

		for (const [key, field] of Object.entries(schema.properties)) {
			const isRequired = schema.required.includes(key);

			if (field.type === "object" && field.properties?.mediaType) {
				schemaShape.media = z.object({
					mediaType: z.string().optional(),
					url: z.string().optional(),
					file: z.instanceof(File).optional(),
					cid: z.string().optional() // Add the cid property to fix the linter error
				});

			} else if (field.type === "array") {
				schemaShape[key] = z.array(z.string())
			} else if (field.type === "string" && field.format === "date") {
				const dateSchema = z.string()
					.refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
						message: "Please enter a valid date"
					});

				schemaShape[key] = isRequired
					? dateSchema
					: dateSchema.optional();
			} else {
				const stringSchema = z.string();
				schemaShape[key] = isRequired
					? stringSchema.min(1, `${field.description} is required`)
					: stringSchema;
			}
		}

		return z.object(schemaShape);
	};

	const formSchema = schema ? createFormSchema(schema) : z.object({});
	const form = useForm<EntryFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {},
		mode: "onTouched" // Validate on blur
	});

	// Track form state for errors and dirty fields
	const { errors, dirtyFields } = useFormState({
		control: form.control
	});

	useEffect(() => {
		// Get template type from URL or use the schemaId passed from props
		const params = new URLSearchParams(window.location.search);
		const template = schemaId || params.get("template") || "blog";

		loadSchema(template);
	}, [schemaId]);

	useEffect(() => {
		if (schema) {
			// Initialize form with empty values
			const defaultValues: EntryFormData = {};
			for (const key of Object.keys(schema.properties)) {
				if (schema.properties[key].type === "array") {
					defaultValues[key] = [];
				} else if (schema.properties[key].type === "object" && schema.properties[key].properties?.mediaType) {
					defaultValues[key] = { mediaType: "", url: "" };
				} else if (schema.properties[key].type === "string" && schema.properties[key].format === "date") {
					defaultValues[key] = undefined; // Default date fields to undefined
				} else {
					defaultValues[key] = "";
				}
			}
			form.reset(defaultValues);

			// Trigger animation after form is initialized
			setTimeout(() => {
				setIsAnimated(true);
			}, 100);
		}
	}, [schema, form]);

	// Decouple the file upload and metadata upload
	// as easier to use form-data for the file upload
	// and json for the metadata upload

	const onSubmit = async (values: EntryFormData) => {
		setIsSubmitting(true);
		console.log("debug:", values, typeof values);
		try {
			// Show global progress bar
			await simulateProgress();

			const uploadResult = await submitContent(values, (progress) => {
				setUploadProgress(progress);
			});

			console.log('uploadResult', uploadResult);
			// Process the submission with uploaded files
			console.log("Form submitted with processed data:", values);
		} catch (error) {
			console.error("Error submitting form:", error);
		} finally {
			setIsSubmitting(false);
			setUploadProgress(0);
		}
	};

	const onInvalidSubmit = () => {
		// Mark all required fields as touched to show validation errors
		if (schema) {
			for (const field of schema.required) {
				form.trigger(field);
			}
		}
	};

	const renderField = (name: string, field: SchemaField, index: number) => {
		const isRequired = Boolean(schema?.required.includes(name));
		// A field is dirty if it's been touched by the user or if the form has been submitted
		const isDirty = !!dirtyFields[name] || form.formState.isSubmitted;
		const error = errors[name]?.message as string | undefined;

		// Animation delay based on field index
		const delayClass = isAnimated ? `delay-${Math.min(index * 100, 500)}` : '';
		const animationClass = isAnimated ? 'field-slide-up' : 'opacity-0';

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

	if (!schema) {
		return <div>Loading...</div>;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="md:col-span-2">
					<Card className="p-6">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
								{Object.entries(schema.properties).map(([name, field], index) =>
									renderField(name, field, index)
								)}
								<Button
									type="submit"
									disabled={isSubmitting}
									className={`w-full ${isAnimated ? 'field-slide-up delay-500' : 'opacity-0'}`}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{uploadProgress > 0 && uploadProgress < 1 ?
												`Uploading... ${Math.round(uploadProgress * 100)}%` :
												"Saving..."}
										</>
									) : (
										"Save Content"
									)}
								</Button>
							</form>
						</Form>
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
									{isSchemaExpanded ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
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
											{Object.entries(schema.properties).map(
												([name, field]) => (
													<li key={name}>
														{name} ({field.type})
														{field.format && ` - ${field.format}`}
													</li>
												),
											)}
										</ul>
									</div>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
