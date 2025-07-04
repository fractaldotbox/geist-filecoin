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

type AccessRule = {
	id: string;
	criteriaType: string;
	criteria: string;
	access: string;
	createdAt: number | string;
};

type AccessRuleListProps = {
	rules: readonly AccessRule[];
	expandedRuleId: string | null;
	setExpandedRuleId: (id: string | null) => void;
};

const AccessRuleList: React.FC<AccessRuleListProps> = ({
	rules,
	expandedRuleId,
	setExpandedRuleId,
}) => {
	if (!rules.length) {
		return (
			<Card className="p-8 text-center">
				<div className="flex flex-col items-center">
					<h3 className="text-xl font-semibold mb-2">No Access Rules</h3>
					<p className="text-muted-foreground mb-4">
						Add your first access rule to get started.
					</p>
				</div>
			</Card>
		);
	}
	return (
		<div className="space-y-4">
			{rules.map((rule) => {
				let criteria = {};
				let access = {};
				try {
					criteria = JSON.parse(rule.criteria);
				} catch {}
				try {
					access = JSON.parse(rule.access);
				} catch {}
				const isExpanded = expandedRuleId === rule.id;
				return (
					<Collapsible
						key={rule.id}
						open={isExpanded}
						onOpenChange={(open) => setExpandedRuleId(open ? rule.id : null)}
					>
						<Card className="p-4">
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">
										{rule.criteriaType}
									</CardTitle>
									<CardDescription>
										Created: {new Date(rule.createdAt).toLocaleString()}
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

export default AccessRuleList;
