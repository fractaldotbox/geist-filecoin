import { ThemeToggle } from "./ThemeToggle";

interface ContentHeaderProps {
	title: string;
}

export function ContentHeader({ title }: ContentHeaderProps) {
	return (
		<div className="sticky top-0 z-50 bg-background border-b pb-2 mb-2">
			<div className="flex justify-between items-center">
				<div className="text-2xl font-bold">
					<a href="/">Geist</a>
				</div>
				<div className="text-lg font-light">{title}</div>
				<div className="flex items-center gap-4">
					<ThemeToggle />
				</div>
			</div>
		</div>
	);
}
