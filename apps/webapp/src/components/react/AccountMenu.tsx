import { loginWithBluesky } from "@/lib/bluesky-oauth";
import { getShortForm } from "@/lib/utils/string";
import { Copy, LogIn, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUiState } from "../../livestore/queries";
import { LoginState, useAuth } from "./AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface LoginFormData {
	email: string;
}

interface BlueskyHandleFormData {
	handle: string;
}

export function AccountMenu() {
	// Get login functionality from AuthProvider
	const { loginStatus, login, logout, resetLoginStatus, setLoginStatus } =
		useAuth();

	const handle = localStorage.getItem("geist.user.handle") || "";

	const [uiState, setUiState] = useUiState();

	const form = useForm<LoginFormData>({
		defaultValues: {
			email: uiState?.currentLoginEmail || "",
		},
	});

	const blueskyForm = useForm<BlueskyHandleFormData>({
		defaultValues: {
			handle: "",
		},
	});

	// Auto-close dialog when login is successful
	useEffect(() => {
		if (loginStatus.state === LoginState.Success) {
			setUiState({ isLoginDialogOpen: false });
			resetLoginStatus();
			setUiState({ currentLoginEmail: "" });
			form.reset();
		}
	}, [loginStatus.state, setUiState, resetLoginStatus, form]);

	// Copy DID to clipboard
	const copyDid = async () => {
		if (uiState?.currentUserDid) {
			try {
				await navigator.clipboard.writeText(uiState.currentUserDid);
			} catch (error) {
				console.error("Failed to copy DID:", error);
			}
		}
	};

	// Handle login form submission
	const onSubmit = async (data: LoginFormData) => {
		// Store the email in UI state
		setUiState({ currentLoginEmail: data.email });
		await login(data.email);
		form.reset();
	};

	// Handle Bluesky handle form submission
	const onBlueskySubmit = async (data: BlueskyHandleFormData) => {
		try {
			setLoginStatus(LoginState.Loading);

			// Add a delay to ensure loading state renders before redirect
			await new Promise((resolve) => setTimeout(resolve, 100));
			await loginWithBluesky(data.handle);
			// Don't reset form here since we're redirecting
		} catch (error) {
			console.error("Bluesky login failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to connect to Bluesky";
			setLoginStatus({
				state: LoginState.Error,
				error: errorMessage,
			});
		}
	};

	// Open login dialog
	const openLoginDialog = () => {
		setUiState({ isLoginDialogOpen: true });
	};

	// Reset states when dialog closes
	const handleDialogChange = (open: boolean) => {
		// Prevent closing dialog when login is pending
		if (!open && loginStatus.state === LoginState.Pending) {
			return;
		}

		setUiState({ isLoginDialogOpen: open });
		if (!open) {
			resetLoginStatus();
			setUiState({ currentLoginEmail: "" });
			form.reset();
			blueskyForm.reset();
			setUiState({ isShowSocialLogins: false, isLoginDialogOpen: false });
		}
	};

	return (
		<>
			{uiState?.currentUserDid ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
						>
							<Avatar className="h-8 w-8">
								<AvatarImage src="" alt="User avatar" />
								<AvatarFallback className="text-xs">
									<User className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="font-mono text-xs flex items-center justify-between cursor-pointer"
							onClick={copyDid}
						>
							<span>{getShortForm(uiState.currentUserDid, 10)}</span>
							<Copy className="h-3 w-3 text-muted-foreground" />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Button
					variant="outline"
					size="sm"
					onClick={openLoginDialog}
					className="flex items-center gap-2"
				>
					<LogIn className="h-4 w-4" />
					Login
				</Button>
			)}

			<Dialog
				open={uiState?.isLoginDialogOpen || false}
				onOpenChange={handleDialogChange}
			>
				<DialogContent className="sm:max-w-[425px] [&>button]:hidden">
					<DialogHeader>
						<DialogTitle>Login to Storacha</DialogTitle>
						<DialogDescription>
							{loginStatus.state === LoginState.Pending
								? "We've sent you a login link. Please check your email to continue."
								: "Choose your preferred login method below."}
						</DialogDescription>
					</DialogHeader>

					{loginStatus.state === LoginState.Pending ? (
						<div className="text-center py-6">
							<div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
								<svg
									className="w-6 h-6 text-green-600 dark:text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Success</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<p className="text-sm text-muted-foreground">
								Please check your email and click the login link to continue.
							</p>
						</div>
					) : (
						<Tabs defaultValue="storacha" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="storacha">Storacha</TabsTrigger>
								<TabsTrigger value="oauth">Social Login</TabsTrigger>
							</TabsList>

							<TabsContent value="storacha" className="space-y-4">
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-4"
									>
										<FormField
											control={form.control}
											name="email"
											rules={{
												required: "Email is required",
												pattern: {
													value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
													message: "Invalid email address",
												},
											}}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input
															placeholder="Enter your email"
															type="email"
															{...field}
															disabled={
																loginStatus.state === LoginState.Loading
															}
															defaultValue={uiState?.currentLoginEmail || ""}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										{loginStatus.state === LoginState.Error &&
											loginStatus.error && (
												<div className="text-sm text-red-600 dark:text-red-400">
													{loginStatus.error}
												</div>
											)}
										<div className="flex justify-end gap-2">
											<Button
												type="button"
												variant="outline"
												onClick={() => handleDialogChange(false)}
												disabled={loginStatus.state === LoginState.Loading}
											>
												Cancel
											</Button>
											<Button
												type="submit"
												disabled={loginStatus.state === "loading"}
											>
												{loginStatus.state === LoginState.Loading
													? "Sending..."
													: "Send Login Link"}
											</Button>
										</div>
									</form>
								</Form>
							</TabsContent>

							<TabsContent value="oauth" className="space-y-4">
								<div className="space-y-4">
									<div className="text-center">
										<p className="text-sm text-muted-foreground mb-4">
											Sign in with your social account
										</p>
									</div>

									{!uiState?.isShowSocialLogins ? (
										<Button
											variant="outline"
											onClick={() => setUiState({ isShowSocialLogins: true })}
											disabled={loginStatus.state === LoginState.Loading}
											className="w-full flex items-center gap-2"
										>
											<svg
												className="w-4 h-4"
												viewBox="0 0 24 24"
												fill="currentColor"
												aria-label="Bluesky logo"
											>
												<title>Bluesky</title>
												<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.015.27-.05.395-.099-.385.793-.395 1.533 0 2.327a3.66 3.66 0 0 1-.395-.1c-2.67-.295-5.568.629-6.383 3.364C.378 20.072 0 25.032 0 25.72c0 .69.139 1.861.902 2.204.659.298 1.664.62 4.3-1.24C7.954 24.742 10.913 20.803 12 18.689c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.86 3.641 1.538 4.3 1.24.763-.343.902-1.515.902-2.204 0-.688-.378-5.648-.624-6.479-.815-2.735-3.713-3.66-6.383-3.364-.136.015-.27.05-.395.099.385-.793.385-1.533 0-2.327.125.05.259.085.395.1 2.67.295 5.568-.629 6.383-3.364.246-.829.624-5.79.624-6.479 0-.688-.139-1.86-.902-2.204-.659-.298-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z" />
											</svg>
											Continue with Bluesky
										</Button>
									) : (
										<Form {...blueskyForm}>
											<form
												onSubmit={blueskyForm.handleSubmit(onBlueskySubmit)}
												className="space-y-4"
											>
												<FormField
													control={blueskyForm.control}
													name="handle"
													rules={{
														required: "Handle is required",
														pattern: {
															value:
																/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
															message: "Invalid handle format",
														},
													}}
													render={({ field }) => (
														<FormItem>
															<FormLabel className="flex items-center gap-2">
																<svg
																	className="w-4 h-4"
																	viewBox="0 0 24 24"
																	fill="currentColor"
																	aria-label="Bluesky logo"
																>
																	<title>Bluesky</title>
																	<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.015.27-.05.395-.099-.385.793-.395 1.533 0 2.327a3.66 3.66 0 0 1-.395-.1c-2.67-.295-5.568.629-6.383 3.364C.378 20.072 0 25.032 0 25.72c0 .69.139 1.861.902 2.204.659.298 1.664.62 4.3-1.24C7.954 24.742 10.913 20.803 12 18.689c1.087 2.114 4.046 6.053 6.798 7.995 2.636 1.86 3.641 1.538 4.3 1.24.763-.343.902-1.515.902-2.204 0-.688-.378-5.648-.624-6.479-.815-2.735-3.713-3.66-6.383-3.364-.136.015-.27.05-.395.099.385-.793.385-1.533 0-2.327.125.05.259.085.395.1 2.67.295 5.568-.629 6.383-3.364.246-.829.624-5.79.624-6.479 0-.688-.139-1.86-.902-2.204-.659-.298-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z" />
																</svg>
																Bluesky Handle
															</FormLabel>
															<FormControl>
																<Input
																	placeholder="your-handle.bsky.social"
																	type="text"
																	{...field}
																	disabled={
																		loginStatus.state === LoginState.Loading
																	}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
												<div className="flex justify-end">
													<Button
														type="submit"
														disabled={loginStatus.state === LoginState.Loading}
														className="w-full"
													>
														{loginStatus.state === LoginState.Loading
															? "Connecting..."
															: "Continue"}
													</Button>
												</div>
											</form>
										</Form>
									)}

									{loginStatus.state === LoginState.Error &&
										loginStatus.error && (
											<div className="text-sm text-red-600 dark:text-red-400 text-center">
												{loginStatus.error}
											</div>
										)}

									<div className="text-center">
										<Button
											variant="ghost"
											onClick={() => handleDialogChange(false)}
											className="text-sm text-muted-foreground"
										>
											Cancel
										</Button>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
