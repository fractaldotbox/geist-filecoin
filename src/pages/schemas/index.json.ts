export const prender = false;

import type { APIRoute } from "astro";
import { schemaIds } from "./schema-loader";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ 
    schemas: schemaIds 
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
} 