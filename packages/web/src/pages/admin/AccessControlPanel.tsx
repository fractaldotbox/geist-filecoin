import AccessRuleList from "@/components/react/AccessRuleList";
import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { Button } from "@/components/react/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/react/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/react/ui/form";
import { Input } from "@/components/react/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/react/ui/select";
import { Textarea } from "@/components/react/ui/textarea";
import { useUiState } from "@/livestore/queries";
import { allAccessRules$ } from "@/livestore/queries";
import {
	CLAIMS_SCHEMA,
	EAS_POLICY_SCHEMA,
	ENV_POLICY_SCHEMA,
} from "@geist-filecoin/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

// --- Utility: Convert JSON Schema to Zod ---
function jsonSchemaToZod(schema: any) {
	const shape: Record<string, any> = {};
	for (const [key, _prop] of Object.entries(schema.properties || {})) {
		const prop = _prop as Record<string, any>;
		if (typeof prop !== "object" || prop === null) continue;
		if (prop.type === "string") {
			let zodField = z.string();
			if (Array.isArray(schema.required) && schema.required.includes(key)) {
				zodField = zodField.min(1, `${prop.description || key} is required`);
			}
			shape[key] = zodField;
		} else if (
			prop.type === "array" &&
			prop.items &&
			prop.items.type === "string"
		) {
			let zodField = z.array(z.string());
			if (Array.isArray(schema.required) && schema.required.includes(key)) {
				zodField = zodField.min(1, `${prop.description || key} is required`);
			}
			shape[key] = zodField;
		}
	}
	return z.object(shape);
}

// --- Utility: Render Form Fields from JSON Schema ---
function renderFieldsFromSchema(schema: any, form: any, parentKey = "") {
	return Object.entries(schema.properties || {}).map(([key, _prop]: any) => {
		const prop = _prop as Record<string, any>;
		if (typeof prop !== "object" || prop === null) return null;
		const name = parentKey ? `${parentKey}.${key}` : key;
		if (prop.type === "string") {
			return (
				<FormField
					key={name}
					control={form.control}
					name={name}
					render={({ field }: any) => (
						<FormItem>
							<FormLabel>{prop.description || key}</FormLabel>
							<FormControl>
								<Input placeholder={prop.examples?.[0] || key} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			);
		}
		if (prop.type === "array" && prop.items && prop.items.type === "string") {
			// UseFieldArray for claims only
			if (name === "claims.claims" || name === "claims") {
				// handled separately
				return null;
			}
			return (
				<FormField
					key={name}
					control={form.control}
					name={name}
					render={({ field }: any) => (
						<FormItem>
							<FormLabel>{prop.description || key}</FormLabel>
							<FormControl>
								<Textarea
									value={
										Array.isArray(field.value) ? field.value.join("\n") : ""
									}
									onChange={(e) => field.onChange(e.target.value.split("\n"))}
									placeholder={`Enter ${key}...`}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			);
		}
		return null;
	});
}

// --- Dynamic Rule Schemas ---
const RULE_SCHEMAS = {
	eas: EAS_POLICY_SCHEMA,
	env: ENV_POLICY_SCHEMA,
};

const POLICY_CRITERIA_TYPES = [
	{ value: "eas", label: "EAS Attestation" },
	{ value: "env", label: "Environment Whitelist" },
] as const;

const TOKEN_TYPES = [
	{ value: "ucan", label: "Storacha UCAN" },
	{ value: "api", label: "API JWT" },
] as const;

type RuleCriteriaType = (typeof POLICY_CRITERIA_TYPES)[number]["value"];

// --- Claims Schema ---
// Define TokenType from CLAIMS_SCHEMA
const TOKEN_TYPE_VALUES = CLAIMS_SCHEMA.properties.anyOf.map(
	(item: any) => item.tokenType,
);
type TokenType = (typeof TOKEN_TYPE_VALUES)[number];

// Fix: Explicitly define ClaimsRuleSchema for correct typing
const ClaimsRuleSchema = z.object({
	tokenType: z.string(),
	claims: z.array(z.string()),
	spaceId: z.string().optional(),
});

// --- Main Rule Schema ---
function getRuleFormSchema(criteriaType: RuleCriteriaType) {
	const dynamicSchema = jsonSchemaToZod(RULE_SCHEMAS[criteriaType]);
	// Always include claims
	return dynamicSchema.extend({
		criteriaType: z.enum(["eas", "env"]),
		claims: ClaimsRuleSchema,
	});
}

type RuleFormType = z.infer<ReturnType<typeof getRuleFormSchema>>;

// Helper to get claims options for a given tokenType
function getClaimsOptions(tokenType: TokenType) {
	const found = CLAIMS_SCHEMA.properties.anyOf.find(
		(item: any) => item.tokenType === tokenType,
	);
	return found ? found.claims : [];
}

export default function AccessControlPanel() {
	const { createAccessPolicy } = useLiveStore();
	const [uiState] = useUiState();
	const [criteriaType, setCriteriaType] = useState<RuleCriteriaType>("eas");
	const [tokenType, setTokenType] = useState<TokenType>("");
	const [submitted, setSubmitted] = useState<RuleFormType | null>(null);
	const RuleFormSchema = getRuleFormSchema(criteriaType);
	const form = useForm<RuleFormType>({
		resolver: zodResolver(RuleFormSchema),
		defaultValues: {
			criteriaType: criteriaType,
			...Object.fromEntries(
				Object.keys(RULE_SCHEMAS[criteriaType].properties).map((k) => [k, ""]),
			),
			claims: { tokenType: "", claims: [], spaceId: "" },
		},
		mode: "onTouched",
	});

	// Fetch all access rules
	const { store } = useStore();
	const rules = store.useQuery(allAccessRules$) || [];
	const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

	async function onSubmit(data: RuleFormType) {
		// Generate a unique id for the rule
		const id = `access-rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		// Get current spaceId from uiState
		const spaceId = uiState?.currentSpaceId || "";
		// Prepare criteria (all fields except claims)
		const { criteriaType, claims, ...criteriaFields } = data;
		// Prepare access (claims)
		const typedClaims = claims as z.infer<typeof ClaimsRuleSchema>;
		const access: any = {
			tokenType: typedClaims.tokenType,
			claims: typedClaims.claims,
		};
		if (typedClaims.tokenType === "ucan" && typedClaims.spaceId) {
			access.spaceId = typedClaims.spaceId;
		}
		await createAccessPolicy({
			id,
			spaceId,
			criteriaType: criteriaType as string,
			criteria: JSON.stringify(criteriaFields),
			access: JSON.stringify(access),
			createdAt: new Date(),
		});
		setSubmitted(data);
	}

	return (
		<div className="max-w-xl mx-auto py-10 space-y-8">
			<div className="container">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="default">Add Policy</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Access Policy</DialogTitle>
						</DialogHeader>
						<FormProvider {...form}>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-6"
								>
									<FormField
										control={form.control}
										name="criteriaType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Policy Criteria Type</FormLabel>
												<FormControl>
													<Select
														value={String(field.value)}
														onValueChange={(val) => {
															setCriteriaType(val as RuleCriteriaType);
															field.onChange(val);
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select policy type" />
														</SelectTrigger>
														<SelectContent>
															{POLICY_CRITERIA_TYPES.map((type) => (
																<SelectItem key={type.value} value={type.value}>
																	{type.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Dynamic Criteria Fields */}
									{renderFieldsFromSchema(RULE_SCHEMAS[criteriaType], form)}
									{/* Claims Fields (always shown) */}
									<hr />
									<h3>Access Token Type</h3>
									<FormField
										control={form.control}
										name="claims.tokenType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Token Type</FormLabel>
												<FormControl>
													<Select
														value={String(field.value)}
														onValueChange={(val) => {
															setTokenType(val);
															field.onChange(val);
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select Token Type" />
														</SelectTrigger>
														<SelectContent>
															{TOKEN_TYPES.map((type) => (
																<SelectItem key={type.value} value={type.value}>
																	{type.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Conditionally render spaceId field for Storacha UCAN */}
									{tokenType === "ucan" && (
										<FormField
											control={form.control}
											name="claims.spaceId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Space ID</FormLabel>
													<FormControl>
														<Input
															placeholder="Enter Storacha Space ID"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									<div>
										<FormLabel>Claims</FormLabel>
										{tokenType && (
											<FormField
												control={form.control}
												name="claims.claims"
												render={({ field }) => (
													<FormItem>
														<div className="flex flex-col gap-2">
															{getClaimsOptions(tokenType).map(
																(claim: string) => {
																	const value: string[] = Array.isArray(
																		field.value,
																	)
																		? field.value
																		: [];
																	return (
																		<label
																			key={claim}
																			className="flex items-center gap-2"
																		>
																			<input
																				type="checkbox"
																				checked={value.includes(claim)}
																				onChange={(e) => {
																					if (e.target.checked) {
																						field.onChange([...value, claim]);
																					} else {
																						field.onChange(
																							value.filter(
																								(v: string) => v !== claim,
																							),
																						);
																					}
																				}}
																			/>
																			<span>{claim}</span>
																		</label>
																	);
																},
															)}
														</div>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
									</div>
									<Button type="submit">Create Policy</Button>
								</form>
							</Form>
						</FormProvider>
						{submitted && (
							<div className="mt-8">
								<h3 className="font-semibold mb-2">Policy JSON</h3>
								<pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
									{JSON.stringify(submitted, null, 2)}
								</pre>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>

			<AccessRuleList
				rules={rules as any[]}
				expandedRuleId={expandedRuleId}
				setExpandedRuleId={setExpandedRuleId}
			/>
		</div>
	);
}
