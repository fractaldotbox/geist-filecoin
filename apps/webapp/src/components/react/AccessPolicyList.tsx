import { Button } from "@/components/react/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/react/ui/card";
import {
	Root as Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import type React from "react";

type AccessPolicy = {
	id: string;
	criteriaType: string;
	criteria: string;
	access: string;
	createdAt: Date;
};

type AccessPolicyListProps = {
	policies: readonly AccessPolicy[];
	expandedPolicyId: string | null;
	setExpandedPolicyId: (id: string | null) => void;
};

const AccessPolicyList: React.FC<AccessPolicyListProps> = ({
	policies,
	expandedPolicyId,
	setExpandedPolicyId,
}) => {
	if (!policies.length) {
		return (
			<Card className="p-8 text-center">
				<div className="flex flex-col items-center">
					<h3 className="text-xl font-semibold mb-2">No Access policies</h3>
					<p className="text-muted-foreground mb-4">
						Add your first access policy to get started.
					</p>
				</div>
			</Card>
		);
	}
	return (
		<div className="space-y-4">
			{policies.map((policy) => {
				let criteria = {};
				let access = {};
				try {
					criteria = JSON.parse(policy.criteria);
				} catch {}
				try {
					access = JSON.parse(policy.access);
				} catch {}
				const isExpanded = expandedPolicyId === policy.id;
				return (
					<Collapsible
						key={policy.id}
						open={isExpanded}
						onOpenChange={(open) =>
							setExpandedPolicyId(open ? policy.id : null)
						}
					>
						<Card className="p-4">
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">
										{policy.criteriaType}
									</CardTitle>
									<CardDescription>
										Created:{" "}
										{policy.createdAt instanceof Date
											? policy.createdAt.toLocaleString()
											: new Date(policy.createdAt).toLocaleString()}
									</CardDescription>
								</div>
								<CardAction>
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 px-2"
											aria-label={isExpanded ? "Hide Details" : "Show Details"}
										>
											{isExpanded ? (
												<ChevronDown className="w-3 h-3" />
											) : (
												<ChevronsUpDown className="w-3 h-3" />
											)}
										</Button>
									</CollapsibleTrigger>
								</CardAction>
							</CardHeader>
							<CardContent>
								<CollapsibleContent>
									<div className="mb-2">
										<span className="font-semibold">Criteria:</span>
										<pre className="bg-muted p-2 rounded text-xs overflow-x-auto mt-1">
											{JSON.stringify(criteria, null, 2)}
										</pre>
									</div>
									<div>
										<span className="font-semibold">Access:</span>
										<pre className="bg-muted p-2 rounded text-xs overflow-x-auto mt-1">
											{JSON.stringify(access, null, 2)}
										</pre>
									</div>
								</CollapsibleContent>
							</CardContent>
						</Card>
					</Collapsible>
				);
			})}
		</div>
	);
};

export default AccessPolicyList;
