import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),
	route("auth/callback", "routes/auth.callback.tsx"),
	route("client-metadata.json", "routes/client-metadata[.]json.tsx"),
] satisfies RouteConfig;
