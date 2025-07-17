import SpaceBreadcrumb from "@/components/react/SpaceBreadcrumb";
import { useSpaceFiles } from "@/components/react/hooks/useStoracha";
import { Badge } from "@/components/react/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/react/ui/breadcrumb";
import { Button } from "@/components/react/ui/button";
import { Card } from "@/components/react/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/react/ui/dropdown-menu";
import { Input } from "@/components/react/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/react/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/react/ui/table";
import { useStore } from "@livestore/react";
import {
	AlertCircle,
	Calendar,
	Copy,
	ExternalLink,
	Eye,
	FilePlus,
	FileText,
	Filter,
	Folder,
	MoreHorizontal,
	RefreshCw,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSpacesDrawer } from "../App";
import { useStorachaContext } from "../components/react/StorachaProvider";
import { StorageProvider } from "../constants/storage-providers";
import { allEntries$, allSpaces$, useUiState } from "../livestore/queries";
import { useSync } from "../services/storachaSync";

// Helper functions
const getEntryStatus = (entry: any) => {
	const daysSinceCreated =
		(Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
	if (entry.publishedAt) return "published";
	if (daysSinceCreated > 30) return "archived";
	return "draft";
};

export default function ContentEntriesPage() {
	const { store } = useStore();
	const spaces = store.useQuery(allSpaces$);
	const entries = store.useQuery(allEntries$);
	const { openSpacesDrawer } = useSpacesDrawer();
	const navigate = useNavigate();

	const [uiState, setUiState] = useUiState();
	const { client: storachaClient, delegation } = useStorachaContext();
	const { sync } = useSync(uiState.currentSpaceId);
	const [isInitialSyncing, setisInitialSyncing] = useState(true);

	// Filter and search state
	const [selectedFilter, setSelectedFilter] = useState<"all" | "recent">("all");
	const [selectedStatus, setSelectedStatus] = useState<
		"all" | "published" | "draft" | "archived"
	>("all");
	const [selectedContentTypeId, setSelectedContentTypeId] =
		useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Auto-sync when Storacha client and spaces are available
	const { loadFiles } = useSpaceFiles({
		client: storachaClient,
		isEnabled: true,
	});

	useEffect(() => {
		(async () => {
			if (!uiState.currentSpaceId || !storachaClient || !delegation) {
				return;
			}
			// TODO remove the hack to periodic sync storacha
			if (!isInitialSyncing) {
				return;
			}

			const files = await loadFiles();

			const uploads = files?.results || [];

			// TODO check race condition on storacha spaceId
			await sync(uploads);
			setisInitialSyncing(false);
		})();
	}, [
		storachaClient,
		uiState.currentSpaceId,
		delegation,
		loadFiles,
		sync,
		isInitialSyncing,
	]);

	// Get unique content types
	const contentTypes = useMemo(() => {
		const types = new Set(entries.map((entry) => entry.contentTypeId));
		return Array.from(types);
	}, [entries]);

	// Filter entries based on all filters
	const filteredEntries = useMemo(() => {
		// Start with entries from current space
		let filtered = entries.filter(
			(entry) => entry.spaceId === uiState.currentSpaceId,
		);

		// Filter by time range
		if (selectedFilter === "recent") {
			filtered = filtered.filter((entry) => {
				const daysDiff =
					(Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
				return daysDiff <= 7;
			});
		}

		// Filter by status
		if (selectedStatus !== "all") {
			filtered = filtered.filter(
				(entry) => getEntryStatus(entry) === selectedStatus,
			);
		}

		// Filter by content type
		if (selectedContentTypeId !== "all") {
			filtered = filtered.filter(
				(entry) => entry.contentTypeId === selectedContentTypeId,
			);
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(entry) =>
					entry.name?.toLowerCase().includes(query) ||
					entry.data?.toLowerCase().includes(query) ||
					entry.contentTypeId?.toLowerCase().includes(query),
			);
		}

		return filtered;
	}, [
		entries,
		uiState.currentSpaceId,
		selectedFilter,
		selectedStatus,
		selectedContentTypeId,
		searchQuery,
	]);

	// Format date for display
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	// Parse tags safely
	const parseTags = (tagsJson: string | null) => {
		if (!tagsJson) return [];
		try {
			return JSON.parse(tagsJson);
		} catch {
			return [];
		}
	};

	// Copy entry ID to clipboard
	const copyEntryId = async (entryId: string) => {
		try {
			await navigator.clipboard.writeText(entryId);
			// You could add a toast notification here if you have a toast system
			console.log("Entry ID copied to clipboard:", entryId);
		} catch (error) {
			console.error("Failed to copy entry ID:", error);
		}
	};

	// Handle row click navigation
	const handleRowClick = (entryId: string) => {
		navigate(`/editor/space/${uiState.currentSpaceId}/entry/${entryId}`);
	};

	return (
		<div id="container">
			<main className="p-6 m-auto">
				<section className="mt-2">
					<div className="space-y-6">
						{/* Header */}
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-2xl font-bold">Content Entries</h3>
								<p className="text-muted-foreground">
									Manage and organize your content
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Link
									to={`/editor/space/${uiState.currentSpaceId}/content-type/select`}
								>
									<Button>
										<FilePlus className="w-4 h-4 mr-2" />
										Create Entry
									</Button>
								</Link>
							</div>
						</div>

						{/* Breadcrumb */}
						<SpaceBreadcrumb
							spaces={spaces}
							currentSpaceId={uiState.currentSpaceId}
						/>

						{/* Filters */}
						<div className="flex items-center gap-4 flex-wrap">
							<div className="flex items-center gap-2">
								<Search className="w-4 h-4 text-muted-foreground" />
								<Input
									placeholder="Search entries..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-64"
								/>
							</div>

							<Select
								value={selectedStatus}
								onValueChange={(value) =>
									setSelectedStatus(
										value as "all" | "published" | "draft" | "archived",
									)
								}
							>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="published">Published</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={selectedContentTypeId}
								onValueChange={setSelectedContentTypeId}
							>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Content Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									{contentTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={selectedFilter}
								onValueChange={(value) =>
									setSelectedFilter(value as "all" | "recent")
								}
							>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Time" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Time</SelectItem>
									<SelectItem value="recent">Recent</SelectItem>
								</SelectContent>
							</Select>

							<Badge variant="secondary" className="flex items-center gap-1">
								<div className="w-2 h-2 bg-green-500 rounded-full" />
								{spaces.length} space{spaces.length > 1 ? "s" : ""}
							</Badge>
						</div>

						{/* Table */}
						{filteredEntries.length > 0 ? (
							<div className="border rounded-lg">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Content Type</TableHead>
											<TableHead>Created</TableHead>
											<TableHead className="w-[70px]" />
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredEntries.map((entry) => {
											const status = getEntryStatus(entry);

											return (
												<TableRow
													key={entry.id}
													className="cursor-pointer hover:bg-muted/50"
													onClick={() => handleRowClick(entry.id)}
												>
													<TableCell>
														<div className="space-y-1">
															<div className="font-medium">
																{entry.name || "Untitled"}
															</div>
															{entry.tags &&
																parseTags(entry.tags).length > 0 && (
																	<div className="flex gap-1">
																		{parseTags(entry.tags)
																			.slice(0, 2)
																			.map((tag: string) => (
																				<Badge
																					key={`${entry.id}-${tag}`}
																					variant="outline"
																					className="text-xs px-1 py-0"
																				>
																					{tag}
																				</Badge>
																			))}
																		{parseTags(entry.tags).length > 2 && (
																			<Badge
																				variant="outline"
																				className="text-xs px-1 py-0"
																			>
																				+{parseTags(entry.tags).length - 2}
																			</Badge>
																		)}
																	</div>
																)}
														</div>
													</TableCell>
													<TableCell>
														<Badge
															variant={
																status === "published"
																	? "default"
																	: status === "draft"
																		? "secondary"
																		: "outline"
															}
															className="capitalize"
														>
															{status}
														</Badge>
													</TableCell>
													<TableCell className="capitalize">
														{entry.contentTypeId}
													</TableCell>
													<TableCell>
														<div className="text-sm">
															{formatDate(entry.createdAt)}
														</div>
														{entry.storageProviderKey && (
															<div className="text-xs text-muted-foreground">
																Provider:{" "}
																{entry.storageProviderKey.substring(0, 8)}...
															</div>
														)}
														{entry.spaceId && (
															<div className="text-xs text-muted-foreground">
																Space:{" "}
																{spaces.find((s) => s.id === entry.spaceId)
																	?.name || entry.spaceId.substring(0, 8)}
															</div>
														)}
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-1">
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<button
																		type="button"
																		className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
																		onClick={(e) => e.stopPropagation()}
																	>
																		<MoreHorizontal className="w-4 h-4" />
																	</button>
																</DropdownMenuTrigger>
																<DropdownMenuContent>
																	<DropdownMenuItem
																		onClick={(e) => {
																			e.stopPropagation();
																			copyEntryId(entry.id);
																		}}
																	>
																		<Copy className="w-4 h-4 mr-2" />
																		Copy entry ID
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						) : (
							<Card className="p-8 text-center">
								<div className="flex flex-col items-center">
									<FileText className="w-12 h-12 text-muted-foreground mb-4" />
									<h4 className="text-lg font-semibold mb-2">
										No Content Found
									</h4>
									<p className="text-muted-foreground mb-4">
										{searchQuery ||
										selectedStatus !== "all" ||
										selectedContentTypeId !== "all" ||
										selectedFilter === "recent"
											? "No content matches your current filters. Try adjusting your search criteria."
											: "Your space is ready but doesn't have any content entries yet."}
									</p>
									<Link to="/editor/content-type/select">
										<Button>Create Your First Entry</Button>
									</Link>
								</div>
							</Card>
						)}

						{/* Footer info */}
						<div className="flex items-center justify-between text-sm text-muted-foreground">
							<div>Showing {filteredEntries.length} entries</div>
							<div className="flex items-center gap-4">
								<span>Connected to {spaces.map((s) => s.name).join(", ")}</span>
								{isInitialSyncing && (
									<span className="text-primary">Syncing...</span>
								)}
							</div>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
}
