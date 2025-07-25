import { getClientMetadata } from "@/lib/client-metadata";

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      console.log('auth callback', code)
    }

    if (url.pathname === "client-metadata.json") {
      const baseUrl = url.origin;
      const clientMetadata = 	getClientMetadata(baseUrl);
      return Response.json(clientMetadata);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }
		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
