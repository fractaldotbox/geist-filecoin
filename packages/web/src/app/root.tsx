import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AppWithLiveStore } from "../Root";
import "../styles/global.css";

export default function Root() {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<div id="root">
					<AppWithLiveStore>
						<Outlet />
					</AppWithLiveStore>
				</div>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
