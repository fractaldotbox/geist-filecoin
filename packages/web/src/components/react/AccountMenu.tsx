import { getShortForm, truncate } from "@/lib/utils/string";
import { Copy, LogIn, User } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUiState } from "../../livestore/queries";
import { LoginState, useAuth } from "./AuthProvider";
import { useLiveStore } from "./hooks/useLiveStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface LoginFormData {
	email: string;
}

export function AccountMenu() {
	// Get login functionality from AuthProvider
	const { loginStatus, login, resetLoginStatus } = useAuth();

	const [uiState, setUiState] = useUiState();

	console.log("AccountMenu", uiState?.currentUserDid, uiState);

	const form = useForm<LoginFormData>({
		defaultValues: {
			email: uiState?.currentLoginEmail || "",
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
						{/* <DropdownMenuItem>Settings</DropdownMenuItem>
						<DropdownMenuItem>Sign out</DropdownMenuItem> */}
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
								<div className="text-center py-6">
									<p className="text-sm text-muted-foreground mb-4">
										Social login is coming soon. Please use the Storacha option
										for now.
									</p>
									<Button
										variant="outline"
										onClick={() => handleDialogChange(false)}
										className="w-full"
									>
										Close
									</Button>
								</div>
							</TabsContent>
						</Tabs>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
