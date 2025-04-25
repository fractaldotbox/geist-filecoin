import { ThemeToggle } from "./ThemeToggle";

interface ContentHeaderProps {
	title: string;
}

export function ContentHeader({ title }: ContentHeaderProps) {
	return (
		<div className="sticky top-0 z-50 bg-background border-b pb-2 mb-2">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">{title}</h1>
				<div className="flex items-center gap-4">
					<ThemeToggle />
				</div>
			</div>
		</div>
	);
}
